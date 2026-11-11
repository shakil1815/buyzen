export type CardResult = { valid: boolean; error?: string; brand?: string };

const BRANDS: Array<[RegExp, string]> = [
  [/^4\d{12}(\d{3})?(\d{3})?$/, "Visa"],
  [/^5[1-5]\d{14}$/, "Mastercard"],
  [/^3[47]\d{13}$/, "American Express"],
  [/^6(?:011|5\d{2})\d{12}$/, "Discover"],
];

export function luhnCheck(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCard(cardNumber: string, expiry: string, cvc: string): CardResult {
  const digits = cardNumber.replace(/\D/g, "");
  if (!luhnCheck(digits)) {
    return { valid: false, error: "That card number does not look right." };
  }

  const brand = BRANDS.find(([pattern]) => pattern.test(digits))?.[1];

  const match = expiry.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
  if (!match) return { valid: false, error: "Expiry must be in MM/YY format." };

  const month = Number(match[1]);
  const rawYear = Number(match[2]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  if (month < 1 || month > 12) {
    return { valid: false, error: "Expiry month must be between 01 and 12." };
  }

  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  if (endOfMonth < now) {
    return { valid: false, error: "That card has expired." };
  }

  if (!/^\d{3,4}$/.test(cvc)) {
    return { valid: false, error: "CVC must be 3 or 4 digits." };
  }

  return { valid: true, brand };
}

export function maskCard(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  return `•••• ${digits.slice(-4)}`;
}
