/** Order status machine shared by the storefront and the admin console. */

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** Allowed forward transitions. Anything not listed is rejected server side. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: string, to: string) {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  return ORDER_TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: string): OrderStatus[] {
  return isOrderStatus(from) ? ORDER_TRANSITIONS[from] : [];
}

export const PAYMENT_METHODS = [
  "bkash",
  "nagad",
  "rocket",
  "cod",
  "card",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bkash: "bKash (manual)",
  nagad: "Nagad (manual)",
  rocket: "Rocket (manual)",
  cod: "Cash on delivery",
  card: "Card (gateway)",
  stripe: "Stripe",
};

/** Checkout options offered to shoppers. */
export const PAYMENT_METHOD_OPTIONS = [
  { value: "bkash", label: "bKash", hint: "Send to 01XXX-XXXXXX" },
  { value: "nagad", label: "Nagad", hint: "Send to 01XXX-XXXXXX" },
  { value: "rocket", label: "Rocket", hint: "Send to 01XXX-XXXXXX" },
  { value: "cod", label: "Cash on delivery", hint: "Pay when the parcel arrives" },
  { value: "card", label: "Card", hint: "Demo card gateway" },
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

export function statusTone(status: string) {
  switch (status) {
    case "DELIVERED":
    case "PAID":
    case "VERIFIED":
      return "green" as const;
    case "CANCELLED":
    case "REJECTED":
    case "FAILED":
      return "red" as const;
    case "PENDING":
    case "PROCESSING":
    case "PACKED":
    case "CONFIRMED":
      return "amber" as const;
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "blue" as const;
    case "RETURNED":
    case "REFUNDED":
      return "info" as const;
    default:
      return "grey" as const;
  }
}
