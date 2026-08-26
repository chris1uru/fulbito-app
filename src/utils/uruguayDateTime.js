export const URUGUAY_TIME_ZONE = "America/Montevideo";

const URUGUAY_OFFSET = "-03:00";

function asDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function formatUruguayTime(value, options = {}) {
  return asDate(value).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: URUGUAY_TIME_ZONE,
    ...options,
  });
}

export function formatUruguayDate(value, options = {}) {
  return asDate(value).toLocaleDateString("es-UY", {
    timeZone: URUGUAY_TIME_ZONE,
    ...options,
  });
}

export function formatUruguayDateTime(value, options = {}) {
  return asDate(value).toLocaleString("es-UY", {
    timeZone: URUGUAY_TIME_ZONE,
    ...options,
  });
}

export function formatUruguayCalendarDate(value, options = {}) {
  return formatUruguayDate(`${value}T12:00:00${URUGUAY_OFFSET}`, options);
}

export function uruguayDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: URUGUAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(asDate(value));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function addUruguayDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export function addUruguayMonths(dateKey, months) {
  const [year, month] = dateKey.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${result.toISOString().slice(0, 7)}-01`;
}

export function dateFromUruguayKey(dateKey) {
  return new Date(`${dateKey}T12:00:00${URUGUAY_OFFSET}`);
}

export function nextUruguayHourSelection(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: URUGUAY_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(asDate(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  let nextHour = hour + 1;
  let date = uruguayDateKey(value);
  if (nextHour === 24) {
    nextHour = 0;
    date = addUruguayDays(date, 1);
  }
  if (nextHour > 1 && nextHour < 10) nextHour = 10;
  return { date, time: `${String(nextHour).padStart(2, "0")}:00` };
}

export function uruguayDayRange(dateKey) {
  return {
    from: new Date(`${dateKey}T00:00:00${URUGUAY_OFFSET}`).toISOString(),
    to: new Date(
      `${addUruguayDays(dateKey, 1)}T00:00:00${URUGUAY_OFFSET}`,
    ).toISOString(),
  };
}
