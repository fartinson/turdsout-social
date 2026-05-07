"use client";

type Props = {
  createdAt: string;
  showTime: boolean;
};

function formatAbsoluteDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatTimeSince(d: Date, now = new Date()) {
  const seconds = Math.round((d.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(seconds);

  // Avoid silly-long "ago" strings.
  if (absSeconds >= 60 * 60 * 24 * 30) return null;

  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
    style: "short",
  });

  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, unitSeconds] of divisions) {
    if (absSeconds >= unitSeconds || unit === "second") {
      const value = Math.round(seconds / unitSeconds);
      return rtf.format(value, unit);
    }
  }

  return null;
}

export function FeedCardTimestamp({ createdAt, showTime }: Props) {
  const created = createdAt ? new Date(createdAt) : new Date();
  const absolute = formatAbsoluteDateTime(created);
  const relative = showTime ? null : formatTimeSince(created);

  return (
    <time dateTime={created.toISOString()} title={absolute}>
      {showTime ? absolute : (relative ?? absolute)}
    </time>
  );
}
