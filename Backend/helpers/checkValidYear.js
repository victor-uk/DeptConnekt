export function checkYearIsValid (value) {
  const currentYear = new Date().getFullYear()
  return value === 0 || value >= 2020 && value <= currentYear + 1
}
