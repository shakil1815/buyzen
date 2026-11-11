"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart,
  applyCoupon,
  clearCart,
  getCart,
  getOrCreateCart,
  removeCartItem,
  removeCoupon,
  setCartItemQuantity,
} from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function addItemAction(productId: string, quantity = 1) {
  await addToCart(productId, quantity);
  revalidatePath("/cart");
  revalidatePath("/");
}

export async function updateItemAction(itemId: string, quantity: number) {
  await setCartItemQuantity(itemId, quantity);
  revalidatePath("/cart");
}

export async function removeItemAction(itemId: string) {
  await removeCartItem(itemId);
  revalidatePath("/cart");
}

export async function clearCartAction() {
  await clearCart();
  revalidatePath("/cart");
}

export async function applyCouponAction(code: string) {
  const coupon = await applyCoupon(code);
  revalidatePath("/cart");
  return coupon
    ? { ok: true as const, message: coupon.description ?? `Code ${coupon.code} applied.` }
    : { ok: false as const, message: "That promo code could not be found." };
}

export async function removeCouponAction() {
  await removeCoupon();
  revalidatePath("/cart");
}

export async function toggleWishlistAction(productId: string) {
  const user = await getSession();
  if (!user) return { ok: false as const, requiresAuth: true };

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { ok: true as const, saved: false };
  }

  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  revalidatePath("/account/wishlist");
  return { ok: true as const, saved: true };
}

export async function getWishlistState(productIds: string[]) {
  const user = await getSession();
  if (!user || productIds.length === 0) return [] as string[];
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id, productId: { in: productIds } },
    select: { productId: true },
  });
  return items.map((item) => item.productId);
}

export async function getCartSummary() {
  const cart = await getCart();
  if (!cart) return { itemCount: 0, subtotal: 0 };
  return {
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
  };
}

export async function ensureCart() {
  return getOrCreateCart();
}
