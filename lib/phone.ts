// Indian mobile numbers only: exactly 10 digits, starting 6–9.
// A leading +91 / 91 / 0 is allowed and stripped, and spaces or dashes are
// ignored — so "+91 98765 43210", "098765-43210" and "9876543210" all count
// as the same number. Anything with fewer or more digits is rejected, so the
// user can't continue until the number is complete.
export function normalizePhone(value: string): string | null {
  let d = String(value || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function isValidPhone(value: string): boolean {
  return normalizePhone(value) !== null;
}

export const PHONE_ERROR = "Please enter a valid 10-digit mobile number.";
