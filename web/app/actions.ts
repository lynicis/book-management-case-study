"use server";

import { revalidateTag } from "next/cache";

import BookClient from "@/clients/book.client";

export async function revalidateCache(): Promise<void> {
  return revalidateTag(BookClient.cacheKey);
}
