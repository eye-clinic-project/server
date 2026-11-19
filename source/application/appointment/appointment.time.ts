export interface DayRange {
  start: Date;
  end: Date;
}

const partsIn = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
};

const offsetMs = (date: Date, timeZone: string): number => {
  const p = partsIn(date, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
};

const startOfZonedDay = (year: number, month: number, day: number, timeZone: string): Date => {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
};

export const dayRangeOf = (date: Date, timeZone: string): DayRange => {
  const { year, month, day } = partsIn(date, timeZone);
  return { start: startOfZonedDay(year, month, day, timeZone), end: startOfZonedDay(year, month, day + 1, timeZone) };
};

export const dayRangeFromString = (value: string, timeZone: string): DayRange => {
  const [year, month, day] = value.split('-').map(Number);
  return { start: startOfZonedDay(year, month, day, timeZone), end: startOfZonedDay(year, month, day + 1, timeZone) };
};
