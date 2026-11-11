"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type ReviewState = { error?: string; success?: string };

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(3, "Give your review a short title"),
  body: z.string().min(10, "Tell us a little more (10 characters minimum)"),
});

export async function submitReviewAction(
  _state: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const user = await getSession();
  if (!user) return { error: "Please sign in to write a review." };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your review." };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product) return { error: "That product no longer exists." };

  await prisma.review.upsert({
    where: {
      productId_userId: { productId: product.id, userId: user.id },
    },
    update: {
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
    },
    create: {
      productId: product.id,
      userId: user.id,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
    },
  });

  const aggregate = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: {
      rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      reviewCount: aggregate._count.rating,
    },
  });

  revalidatePath(`/products/${product.slug}`);
  return { success: "Thanks! Your review is live." };
}

export async function subscribeAction(
  _state: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) return { success: "You are already on the list." };

  await prisma.subscriber.create({ data: { email } });
  return { success: "You are subscribed. Welcome aboard!" };
}
