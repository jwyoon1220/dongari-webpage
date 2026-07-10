/** ISO 문자열을 "YYYY-MM-DD HH:mm" 형식으로 표시한다. */
export function formatDate(isoString: string): string {
  const normalized = isoString.includes('T') ? isoString : isoString.replace(' ', 'T');
  const withZone = normalized.endsWith('Z') ? normalized : `${normalized}Z`;
  const date = new Date(withZone);
  if (Number.isNaN(date.getTime())) return isoString;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}
