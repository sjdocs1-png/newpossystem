export type BusinessDayWarningStage = 'none' | 'warning' | 'critical';

interface BusinessDayWindow {
  start: Date;
  end: Date;
  nextResetAt: Date;
  businessDate: string;
}

const parseResetTime = (resetTime: string) => {
  const [hours, minutes] = resetTime.split(':').map((value) => Number(value));
  return {
    hours: Number.isFinite(hours) && hours >= 0 && hours < 24 ? hours : 6,
    minutes: Number.isFinite(minutes) && minutes >= 0 && minutes < 60 ? minutes : 0,
  };
};

const formatBusinessDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeBusinessDate = (businessDate: Date | string, resetTime: string) => {
  const result = typeof businessDate === 'string' ? new Date(businessDate) : new Date(businessDate);
  const { hours, minutes } = parseResetTime(resetTime);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export const getBusinessDayWindow = (
  resetTime: string,
  businessDate?: Date | string,
  referenceDate?: Date
): BusinessDayWindow => {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const { hours, minutes } = parseResetTime(resetTime);

  let start: Date;
  if (businessDate) {
    start = normalizeBusinessDate(businessDate, resetTime);
  } else {
    const todayReset = new Date(now);
    todayReset.setHours(hours, minutes, 0, 0);

    if (now < todayReset) {
      start = new Date(todayReset);
      start.setDate(start.getDate() - 1);
    } else {
      start = todayReset;
    }
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const nextResetAt = new Date(start);
  nextResetAt.setDate(nextResetAt.getDate() + 1);

  return {
    start,
    end,
    nextResetAt,
    businessDate: formatBusinessDate(start),
  };
};

export const getBusinessDayDate = (resetTime: string, referenceDate?: Date) => {
  return getBusinessDayWindow(resetTime, undefined, referenceDate).start;
};

export const formatBusinessResetTime = (resetTime: string) => {
  const { hours, minutes } = parseResetTime(resetTime);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getTimeUntil = (targetDate: Date, referenceDate?: Date) => {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return '0m';

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }

  return `${minutes}m`;
};

export const getWarningStage = (
  nextResetAt: Date,
  warningMinutes: number,
  referenceDate?: Date
): BusinessDayWarningStage => {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const diffMs = nextResetAt.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / 60000);

  if (diffMinutes <= 0) return 'critical';
  if (diffMinutes <= 5) return 'critical';
  if (diffMinutes <= warningMinutes) return 'warning';
  return 'none';
};
