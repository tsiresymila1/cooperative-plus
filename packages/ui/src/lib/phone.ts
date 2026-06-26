// Phone validation/formatting via libphonenumber-js. Default region = Madagascar.
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const DEFAULT_COUNTRY: CountryCode = "MG";

/** True if the input is a valid phone number (assumes MG when no country code). */
export function isValidPhone(input: string, country: CountryCode = DEFAULT_COUNTRY): boolean {
  if (!input?.trim()) return false;
  const p = parsePhoneNumberFromString(input.trim(), country);
  return !!p && p.isValid();
}

/** E.164 form (`+261340000000`) or null when invalid. */
export function toE164(input: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  const p = parsePhoneNumberFromString((input ?? "").trim(), country);
  return p && p.isValid() ? p.number : null;
}

/** Pretty national form for display; falls back to the raw input. */
export function formatPhone(input: string, country: CountryCode = DEFAULT_COUNTRY): string {
  const p = parsePhoneNumberFromString((input ?? "").trim(), country);
  return p && p.isValid() ? p.formatNational() : (input ?? "");
}
