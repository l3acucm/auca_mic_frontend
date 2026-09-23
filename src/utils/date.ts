// DRF's REST_FRAMEWORK.DATETIME_FORMAT = '%s' — every datetime the API
// returns is a Unix-epoch-seconds string ("1790078936"), not ISO 8601.
// `new Date(thatString)` misparses it (JS's Date string parser doesn't
// recognize bare epoch seconds), producing a garbled/invalid date.
export function formatApiDate(value: string): string {
  return new Date(Number(value) * 1000).toLocaleString()
}
