"use server"

import { db } from "@/lib/db"
import {
  user,
  userPreferences,
  expenses,
  subscriptions,
  categories,
  invoices,
} from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { userPreferencesSchema } from "@/lib/validators"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const PREFERENCE_DEFAULTS = {
  currency: "SAR",
  dateFormat: "yyyy-MM-dd",
  defaultCategoryId: null,
  emailNotifications: true,
  weeklyReport: false,
} as const

export async function getUserPreferences() {
  const session = await requireSession()

  const [result] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1)

  if (!result) return { ...PREFERENCE_DEFAULTS }

  return {
    currency: result.currency,
    dateFormat: result.dateFormat,
    defaultCategoryId: result.defaultCategoryId,
    emailNotifications: result.emailNotifications,
    weeklyReport: result.weeklyReport,
  }
}

export async function updateUserPreferences(data: unknown) {
  const session = await requireSession()
  const parsed = userPreferencesSchema.parse(data)

  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      currency: parsed.currency,
      dateFormat: parsed.dateFormat,
      defaultCategoryId: parsed.defaultCategoryId ?? null,
      emailNotifications: parsed.emailNotifications,
      weeklyReport: parsed.weeklyReport,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        currency: parsed.currency,
        dateFormat: parsed.dateFormat,
        defaultCategoryId: parsed.defaultCategoryId ?? null,
        emailNotifications: parsed.emailNotifications,
        weeklyReport: parsed.weeklyReport,
        updatedAt: new Date(),
      },
    })

  revalidatePath("/settings")
}

export async function updateUserImage(imageDataUrl: string) {
  const session = await requireSession()

  // Validate it's a data URL or a http(s) URL
  if (!imageDataUrl.startsWith("data:image/") && !imageDataUrl.startsWith("http")) {
    throw new Error("Invalid image URL")
  }

  // Limit size (~2MB for base64 data URLs)
  if (imageDataUrl.length > 2 * 1024 * 1024) {
    throw new Error("Image too large")
  }

  await db
    .update(user)
    .set({ image: imageDataUrl, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  revalidatePath("/settings")
}

export async function exportUserData() {
  const session = await requireSession()
  const userId = session.user.id

  const [userCategories, userExpenses, userSubscriptions, userInvoices] =
    await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId)),
      db
        .select()
        .from(expenses)
        .where(eq(expenses.userId, userId)),
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId)),
      db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, userId)),
    ])

  return {
    exportedAt: new Date().toISOString(),
    categories: userCategories,
    expenses: userExpenses,
    subscriptions: userSubscriptions,
    invoices: userInvoices,
  }
}
