interface FormatRelativeTimeOptions {
  fallback?: string;
  withSpaces?: boolean;
}

function formatAbsoluteTime(date: Date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
}

export function formatRelativeTime(
  date: Date | string | undefined | null,
  options?: FormatRelativeTimeOptions
) {
  if (!date) return options?.fallback ?? '刚刚';

  const targetDate = new Date(date);
  const diff = Date.now() - targetDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const space = options?.withSpaces ? ' ' : '';

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}${space}分钟前`;
  if (hours < 24) return `${hours}${space}小时前`;
  if (days < 7) return `${days}${space}天前`;

  return formatAbsoluteTime(targetDate);
}
