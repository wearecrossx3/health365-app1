// A phone number counts as valid once it has at least 10 digits — enough
// to block "typed a couple digits and hit continue" without being overly
// strict about formatting (spaces, dashes, +91, brackets are all fine;
// only the digits are counted).
export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length >= 10;
}
