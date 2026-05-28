import { supabase } from '@/integrations/supabase/client';

const BACKOFF_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
const MAX_RECONNECT_ATTEMPTS = 5;
const PAUSE_AFTER_FAILED_MS = 5 * 60 * 1000;
const HEARTBEAT_GRACE_MS = 120 * 1000;

export type RealtimeEventConfig = {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
};

export type RealtimeSubscriptionDiagnostics = {
  key: string;
  channelName: string;
  storeId: string;
  status: string;
  lastStatus: string | null;
  reconnectAttempts: number;
  lastEventAt: number | null;
  nextRetryAt: number | null;
  pausedUntil: number | null;
  warningLogged: boolean;
  duplicateEventsDropped: number;
  eventConfigs: RealtimeEventConfig[];
};

export type RealtimeSubscriptionConfig = {
  key: string;
  channelName: string;
  storeId: string;
  eventConfigs: RealtimeEventConfig[];
  onEvent: (payload: any) => void;
  onStatus?: (status: string) => void;
  dedupeKey?: (payload: any) => string | null;
  eventBatchMs?: number;
};

type SubscriptionRecord = {
  config: RealtimeSubscriptionConfig;
  channel: any | null;
  status: string;
  lastStatus: string | null;
  reconnectAttempts: number;
  reconnectTimer: number | null;
  pausedUntil: number | null;
  lastEventAt: number | null;
  warningLogged: boolean;
  duplicateEventsDropped: number;
  processedPayloadKeys: Map<string, number>;
  eventQueue: any[];
  eventQueueTimer: number | null;
};

class RealtimeManager {
  private subscriptions = new Map<string, SubscriptionRecord>();
  private online = true;
  private hidden = false;

  constructor() {
    if (typeof window === 'undefined') return;

    this.online = navigator.onLine;
    this.hidden = document.visibilityState !== 'visible';

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('visibilitychange', this.handleVisibilityChange);

    Object.defineProperty(window, 'PAYSTORE_REALTIME_DEBUG', {
      configurable: true,
      enumerable: true,
      get: () => this.getDiagnostics(),
    });
  }

  public subscribe(config: RealtimeSubscriptionConfig) {
    const existing = this.subscriptions.get(config.key);
    if (existing) {
      const sameChannel = existing.config.channelName === config.channelName && existing.config.storeId === config.storeId;
      if (sameChannel) {
        return existing;
      }
      this.unsubscribe(config.key);
    }

    const record: SubscriptionRecord = {
      config,
      channel: null,
      status: 'idle',
      lastStatus: null,
      reconnectAttempts: 0,
      reconnectTimer: null,
      pausedUntil: null,
      lastEventAt: null,
      warningLogged: false,
      duplicateEventsDropped: 0,
      processedPayloadKeys: new Map<string, number>(),
      eventQueue: [],
      eventQueueTimer: null,
    };

    this.subscriptions.set(config.key, record);
    this.openChannel(config.key);
    return record;
  }

  public unsubscribe(key: string) {
    const record = this.subscriptions.get(key);
    if (!record) return;

    if (record.eventQueueTimer != null) {
      window.clearTimeout(record.eventQueueTimer);
      record.eventQueueTimer = null;
      record.eventQueue = [];
    }

    this.clearReconnectTimer(key, record);

    if (record.channel && typeof record.channel.unsubscribe === 'function') {
      try {
        record.channel.unsubscribe();
      } catch (err) {
        console.warn('[RealtimeManager] unsubscribe failed:', err);
      }
    }

    try {
      supabase.removeChannel(record.channel);
    } catch {
      // ignore
    }

    this.subscriptions.delete(key);
  }

  public cleanupAll() {
    Array.from(this.subscriptions.keys()).forEach((key) => this.unsubscribe(key));
  }

  public refreshSubscription(key: string) {
    const record = this.subscriptions.get(key);
    if (!record) return;
    if (record.status === 'connecting' || record.status === 'reconnecting') return;
    const config = record.config;
    this.unsubscribe(key);
    this.subscribe(config);
  }

  public getDiagnostics(): RealtimeSubscriptionDiagnostics[] {
    return Array.from(this.subscriptions.values()).map((record) => ({
      key: record.config.key,
      channelName: record.config.channelName,
      storeId: record.config.storeId,
      status: record.status,
      lastStatus: record.lastStatus,
      reconnectAttempts: record.reconnectAttempts,
      lastEventAt: record.lastEventAt,
      nextRetryAt: record.reconnectTimer ? Date.now() + record.reconnectTimer : null,
      pausedUntil: record.pausedUntil,
      warningLogged: record.warningLogged,
      duplicateEventsDropped: record.duplicateEventsDropped,
      eventConfigs: [...record.config.eventConfigs],
    }));
  }

  private handleOnline = () => {
    this.online = true;
    this.subscriptions.forEach((record, key) => {
      if (record.status === 'offline' || record.status === 'paused' || record.status === 'closed') {
        this.scheduleReconnect(key, true);
      }
    });
  };

  private handleOffline = () => {
    this.online = false;
    this.subscriptions.forEach((record) => {
      record.status = 'offline';
      this.clearReconnectTimer(record.config.key, record);
    });
  };

  private handleVisibilityChange = () => {
    this.hidden = document.visibilityState !== 'visible';
    if (!this.hidden && this.online) {
      this.subscriptions.forEach((record, key) => {
        if (record.status === 'closed' || record.status === 'offline') {
          this.scheduleReconnect(key, true);
        }
      });
    }
  };

  private openChannel(key: string) {
    const record = this.subscriptions.get(key);
    if (!record) return;
    if (!this.online) {
      record.status = 'offline';
      return;
    }

    if (record.pausedUntil && Date.now() < record.pausedUntil) {
      record.status = 'paused';
      return;
    }

    if (record.channel) {
      try {
        record.channel.unsubscribe();
      } catch {
        // ignore
      }
      try {
        supabase.removeChannel(record.channel);
      } catch {
        // ignore
      }
      record.channel = null;
    }

    const channel = supabase.channel(record.config.channelName);
    record.channel = channel;
    record.status = 'connecting';
    record.lastStatus = null;

    record.config.eventConfigs.forEach((eventConfig) => {
      channel.on('postgres_changes', eventConfig, (payload: any) => {
        record.lastEventAt = Date.now();

        const now = Date.now();
        if (record.config.dedupeKey) {
          const dedupeKey = record.config.dedupeKey(payload);
          if (dedupeKey) {
            const previous = record.processedPayloadKeys.get(dedupeKey);
            if (previous && now - previous < 5 * 60 * 1000) {
              record.duplicateEventsDropped += 1;
              return;
            }
            record.processedPayloadKeys.set(dedupeKey, now);
            if (record.processedPayloadKeys.size > 2000) {
              const cutoff = now - 5 * 60 * 1000;
              for (const [key, timestamp] of record.processedPayloadKeys.entries()) {
                if (timestamp < cutoff) {
                  record.processedPayloadKeys.delete(key);
                }
              }
            }
          }
        }

        if (record.config.eventBatchMs && record.config.eventBatchMs > 0) {
          record.eventQueue.push(payload);
          if (record.eventQueueTimer == null) {
            record.eventQueueTimer = window.setTimeout(() => {
              const queuedEvents = [...record.eventQueue];
              record.eventQueue = [];
              record.eventQueueTimer = null;
              queuedEvents.forEach((eventPayload) => record.config.onEvent(eventPayload));
            }, record.config.eventBatchMs) as unknown as number;
          }
          return;
        }

        record.config.onEvent(payload);
      });
    });

    channel.subscribe((status: string) => {
      record.lastStatus = status;
      if (status === 'SUBSCRIBED') {
        record.status = 'subscribed';
        record.reconnectAttempts = 0;
        record.warningLogged = false;
      } else if (status === 'CLOSED' || status === 'CONNECTION_ERROR' || status === 'CHANNEL_ERROR' || status === 'ERROR') {
        record.status = 'closed';
        this.scheduleReconnect(key);
      } else if (status === 'RECONNECTING' || status === 'TIMED_OUT') {
        record.status = 'reconnecting';
      }

      if (typeof record.config.onStatus === 'function') {
        record.config.onStatus(status);
      }
    });
  }

  private scheduleReconnect(key: string, immediate = false) {
    const record = this.subscriptions.get(key);
    if (!record) return;

    if (record.eventQueueTimer != null) {
      window.clearTimeout(record.eventQueueTimer);
      record.eventQueueTimer = null;
      record.eventQueue = [];
    }

    this.clearReconnectTimer(key, record);

    if (!this.online) {
      record.status = 'offline';
      return;
    }

    if (record.pausedUntil && Date.now() < record.pausedUntil) {
      record.status = 'paused';
      return;
    }

    if (record.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      record.pausedUntil = Date.now() + PAUSE_AFTER_FAILED_MS;
      record.status = 'paused';
      if (!record.warningLogged) {
        console.warn('[RealtimeManager] Reconnect paused after repeated failures for channel', record.config.channelName);
        record.warningLogged = true;
      }
      return;
    }

    const backoffMs = BACKOFF_DELAYS_MS[Math.min(record.reconnectAttempts, BACKOFF_DELAYS_MS.length - 1)];
    const jitter = Math.random() * 1000;
    const rawDelay = immediate ? 0 : backoffMs + jitter;
    const effectiveDelay = this.hidden ? Math.min(rawDelay * 2, BACKOFF_DELAYS_MS[BACKOFF_DELAYS_MS.length - 1]) : rawDelay;
    record.status = 'reconnecting';
    record.reconnectTimer = window.setTimeout(() => {
      record.reconnectTimer = null;
      this.openChannel(key);
    }, effectiveDelay) as unknown as number;
    record.reconnectAttempts += 1;
  }

  private clearReconnectTimer(key: string, record: SubscriptionRecord) {
    if (record.reconnectTimer != null) {
      window.clearTimeout(record.reconnectTimer);
      record.reconnectTimer = null;
    }
  }
}

export const realtimeManager = new RealtimeManager();
