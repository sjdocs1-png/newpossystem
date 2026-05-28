const DEFAULT_ALARM_SOURCE = 'data:audio/wav;base64,UklGRl9vT19teleikEk+Xr35hOJCaF29/kiVM7XJXr78uEYzxn5u3cjWdCdOvw2YloRnbq79qKaEZ46+/aimlHeurv2oppR3rq79qKaUd66u/aimlHeurv2oppR3rq79qKaUd66u/aimlHeurv2oppR3rq79qKaUd66u/aimlHeurv2oppRw==';
let audio: HTMLAudioElement | null = null;
let audioUnlocked = false;
let currentSource = DEFAULT_ALARM_SOURCE;
let currentVolume = 1;
let unlockPromise: Promise<boolean> | null = null;

const createAudio = (source: string, volume: number) => {
  const resolvedSource = source || DEFAULT_ALARM_SOURCE;

  if (!audio) {
    audio = new Audio(resolvedSource);
  } else if (audio.src !== resolvedSource) {
    audio.src = resolvedSource;
  }

  currentSource = resolvedSource;
  currentVolume = volume;
  audio.loop = false;
  audio.preload = 'auto';
  audio.volume = volume;
  audio.muted = false;
  audio.onerror = () => {
    if (audio && audio.src !== DEFAULT_ALARM_SOURCE) {
      audio.src = DEFAULT_ALARM_SOURCE;
      audio.load();
    }
  };
  audio.load();
};

export const initAudio = (selectedRingtone = 'ringtone1.wav', customSoundUrl?: string | null, volume = 1) => {
  let source: string;

  if (customSoundUrl) {
    source = customSoundUrl;
  } else if (selectedRingtone && selectedRingtone !== 'ringtone1.wav') {
    // Try to load custom ringtone, but fall back to default if it fails
    source = `/sounds/${selectedRingtone}`;
  } else {
    source = DEFAULT_ALARM_SOURCE;
  }

  console.log('[useOrderSound] initAudio called with:', { selectedRingtone, customSoundUrl, volume, finalSource: source });
  createAudio(source, volume);
};

export const unlockAudio = async (): Promise<boolean> => {
  if (!audio) {
    return false;
  }

  if (audioUnlocked) {
    return true;
  }

  if (unlockPromise) {
    return unlockPromise;
  }

  unlockPromise = new Promise((resolve) => {
    const tryPlay = () => {
      if (!audio) {
        resolve(false);
        return;
      }

      audio.muted = false;
      audio.play()
        .then(() => {
          if (!audio) {
            resolve(false);
            return;
          }
          audio.pause();
          audio.currentTime = 0;
          audioUnlocked = true;
          console.log('[useOrderSound] Audio unlocked');
          resolve(true);
        })
        .catch(() => {
          if (!audio) {
            resolve(false);
            return;
          }
          audio.muted = true;
          audio.play()
            .then(() => {
              if (!audio) {
                resolve(false);
                return;
              }
              audio.pause();
              audio.currentTime = 0;
              audio.muted = false;
              audioUnlocked = true;
              console.log('[useOrderSound] Audio unlocked (muted fallback)');
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
        });
    };

    tryPlay();
  });

  const result = await unlockPromise;
  unlockPromise = null;
  return result;
};

export const playSound = async () => {
  console.log('[useOrderSound] playSound called, audio:', !!audio, 'unlocked:', audioUnlocked);
  if (!audio) {
    console.warn('[useOrderSound] Audio not initialized');
    return;
  }

  if (!audioUnlocked) {
    console.log('[useOrderSound] Audio not unlocked, attempting unlock...');
    await unlockAudio();
  }

  if (!audioUnlocked) {
    console.warn('[useOrderSound] Audio still locked');
    return;
  }

  try {
    console.log('[useOrderSound] Playing sound...');
    audio.currentTime = 0;
    await audio.play().catch(async (error) => {
      console.warn('[useOrderSound] Play failed, trying fallback:', error);
      if (audio && audio.src !== DEFAULT_ALARM_SOURCE) {
        console.log('[useOrderSound] Switching to default alarm source');
        audio.src = DEFAULT_ALARM_SOURCE;
        audio.load();
        audio.currentTime = 0;
        await audio.play().catch((fallbackError) => {
          console.warn('[useOrderSound] Fallback also failed:', fallbackError);
        });
      }
    });
    console.log('[useOrderSound] Sound played successfully');
  } catch (error) {
    console.warn('[useOrderSound] Play error', error);
  }
};

export const stopSound = () => {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
};

export const setOrderSoundSource = (selectedRingtone: string, customSoundUrl: string | null, volume = 1) => {
  let source: string;
  
  if (customSoundUrl) {
    source = customSoundUrl;
  } else if (selectedRingtone && selectedRingtone !== 'ringtone1.wav') {
    // Try to load custom ringtone, but fall back to default if it fails
    source = `/sounds/${selectedRingtone}`;
  } else {
    source = DEFAULT_ALARM_SOURCE;
  }
  
  createAudio(source, volume);
};
