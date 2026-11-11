import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE, getSession } from "@/lib/session";

export const FREE_SHIPPING_THRESHOLD = 15000; // $150
export const SHIPPING_FLAT = 990; // $9.90
export const TAX_RATE = 0.08;

export type CartWithItems = NonNullable<
  Awaited<ReturnType<typeof prisma.cart.findUnique>>
> & {
  items: Array<
    NonNullable<
      Awaited<ReturnType<typeof prisma.cartItem.findMany>>[number]
    > & { product: { id: string; name: string; slug: string; price: number; image: string; stock: number } }
  >;
};

/** Reads the cart id for this visitor (read-only: safe during rendering). */
async function readCartId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Persists a cart id. Only safe inside Server Actions / Route Handlers. */
async function writeCartId(id: string) {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

const cartItemsInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
          stock: true,
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
};

async function loadCart(id: string) {
  return prisma.cart.findUnique({
    where: { id },
    include: cartItemsInclude,
  });
}

export async function getCart(): Promise<CartWithItems | null> {
  const cartId = await readCartId();
  const user = await getSession();

  let cart = cartId ? await loadCart(cartId) : null;

  // Signed-in shoppers keep their cart across devices.
  if (!cart && user) {
    cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: cartItemsInclude,
    });
  }

  if (!cart) return null;

  // A cart owned by somebody else is not visible to this visitor.
  if (cart.userId && cart.userId !== user?.id) return null;

  return cart as CartWithItems;
}

export async function getOrCreateCart(): Promise<CartWithItems> {
  const user = await getSession();
  const cartId = await readCartId();

  let cart = cartId ? await prisma.cart.findUnique({ where: { id: cartId } }) : null;

  if (cart && cart.userId && cart.userId !== user?.id) {
    cart = null; // belongs to another account - start a fresh cart
  }

  if (!cart && user) {
    const owned = await prisma.cart.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    if (owned) cart = owned;
  }

  if (!cart) {
    const id = randomUUID();
    cart = await prisma.cart.create({
      data: { id, userId: user?.id ?? null },
    });
  } else if (user && !cart.userId) {
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { userId: user.id },
    });
  }

  // Keep the cookie pointing at the cart we are actually using.
  if (cartId !== cart.id) await writeCartId(cart.id);

  const withItems = await loadCart(cart.id);
  return (withItems ?? { ...cart, items: [] }) as CartWithItems;
}

export async function addToCart(productId: string, quantity: number) {
  const cart = await getOrCreateCart();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const existing = cart.items.find((item) => item.productId === productId);
  const desired = Math.max(1, quantity);
  const capped = Math.min(desired + (existing?.quantity ?? 0), Math.max(product.stock, 1));

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: capped },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: capped },
    });
  }
  return cart;
}

export async function setCartItemQuantity(itemId: string, quantity: number) {
  const cart = await getOrCreateCart();
  const item = cart.items.find((entry) => entry.id === itemId);
  if (!item) return cart;

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, Math.max(item.product.stock, 1)) },
    });
  }
  return getOrCreateCart();
}

export async function removeCartItem(itemId: string) {
  const cart = await getOrCreateCart();
  if (!cart.items.some((entry) => entry.id === itemId)) return cart;
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getOrCreateCart();
}

export async function clearCart() {
  const cart = await getCart();
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

export async function applyCoupon(code: string) {
  const cart = await getOrCreateCart();
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: coupon ? coupon.code : null },
  });
  return coupon;
}

export async function removeCoupon() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: null },
  });
}

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  couponCode: string | null;
  couponError: string | null;
};

export async function calculateTotals(cart: CartWithItems | null): Promise<Totals> {
  if (!cart || cart.items.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      couponCode: null,
      couponError: null,
    };
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  let discount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;

  if (cart.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: cart.couponCode },
    });
    if (
      !coupon ||
      !coupon.active ||
      (coupon.expiresAt && coupon.expiresAt < new Date()) ||
      (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    ) {
      couponError = "That code is no longer valid.";
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });
    } else if (subtotal < coupon.minSubtotal) {
      couponError = `Spend at least ${(coupon.minSubtotal / 100).toFixed(0)} to use this code.`;
    } else {
      couponCode = coupon.code;
      discount =
        coupon.type === "PERCENT"
          ? Math.round((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal);
    }
  }

  const discounted = subtotal - discount;
  const shipping =
    discounted === 0 || discounted >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = Math.round(discounted * TAX_RATE);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: discounted + shipping + tax,
    itemCount,
    couponCode,
    couponError,
  };
}
