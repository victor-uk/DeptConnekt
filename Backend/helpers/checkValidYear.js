export function checkYearIsValid (value) {
  const currentYear = new Date().getFullYear()
  return value === 0 || Number(value) >= 2020 && Number(value) <= currentYear + 1
}
