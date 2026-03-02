"use server"

import { db } from "@/lib/db"
import { subscriptions, categories } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { subscriptionSchema } from "@/lib/validators"
import { eq, and, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { addWeeks, addMonths, addYears } from "date-fns"

function calculateNextDueDate(
  startDate: string,
  frequency: string
): string {
  const start = new Date(startDate)
  const now = new Date()
  let next = start

  while (next <= now) {
    switch (frequency) {
      case "weekly":
        next = addWeeks(next, 1)
        break
      case "monthly":
        next = addMonths(next, 1)
        break
      case "yearly":
        next = addYears(next, 1)
        break
      default:
        next = addMonths(next, 1)
    }
  }

  return next.toISOString().split("T")[0]
}

export async function getSubscriptions() {
  const session = await requireSession()

  return db
    .select({
      subscription: subscriptions,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(subscriptions)
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .where(eq(subscriptions.userId, session.user.id))
    .orderBy(desc(subscriptions.active), subscriptions.nextDueDate)
}

export async function createSubscription(data: unknown) {
  const session = await requireSession()
  const parsed = subscriptionSchema.parse(data)

  const nextDueDate = calculateNextDueDate(parsed.startDate, parsed.frequency)

  const [created] = await db
    .insert(subscriptions)
    .values({
      userId: session.user.id,
      name: parsed.name,
      amount: parsed.amount,
      currency: parsed.currency,
      frequency: parsed.frequency,
      startDate: parsed.startDate,
      nextDueDate,
      categoryId: parsed.categoryId || null,
      notes: parsed.notes || null,
      active: parsed.active,
    })
    .returning()

  revalidatePath("/subscriptions")
  revalidatePath("/dashboard")
  return created
}

export async function updateSubscription(id: string, data: unknown) {
  const session = await requireSession()
  const parsed = subscriptionSchema.parse(data)

  const nextDueDate = calculateNextDueDate(parsed.startDate, parsed.frequency)

  const [updated] = await db
    .update(subscriptions)
    .set({
      name: parsed.name,
      amount: parsed.amount,
      currency: parsed.currency,
      frequency: parsed.frequency,
      startDate: parsed.startDate,
      nextDueDate,
      categoryId: parsed.categoryId || null,
      notes: parsed.notes || null,
      active: parsed.active,
      updatedAt: new Date(),
    })
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id))
    )
    .returning()

  revalidatePath("/subscriptions")
  revalidatePath("/dashboard")
  return updated
}

export async function toggleSubscription(id: string) {
  const session = await requireSession()

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id))
    )

  if (!sub) throw new Error("Subscription not found")

  const [updated] = await db
    .update(subscriptions)
    .set({ active: !sub.active, updatedAt: new Date() })
    .where(eq(subscriptions.id, id))
    .returning()

  revalidatePath("/subscriptions")
  revalidatePath("/dashboard")
  return updated
}

export async function deleteSubscription(id: string) {
  const session = await requireSession()

  await db
    .delete(subscriptions)
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id))
    )

  revalidatePath("/subscriptions")
  revalidatePath("/dashboard")
}

export async function getSubscriptionStats() {
  const session = await requireSession()

  const [result] = await db
    .select({
      monthlyTotal: sql<string>`COALESCE(SUM(
        CASE
          WHEN ${subscriptions.frequency} = 'weekly' THEN ${subscriptions.amount}::numeric * 4.33
          WHEN ${subscriptions.frequency} = 'monthly' THEN ${subscriptions.amount}::numeric
          WHEN ${subscriptions.frequency} = 'yearly' THEN ${subscriptions.amount}::numeric / 12
          ELSE ${subscriptions.amount}::numeric
        END
      ), 0)`,
      activeCount: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.active} = true)`,
      totalCount: sql<number>`COUNT(*)`,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))

  return {
    monthlyTotal: parseFloat(result.monthlyTotal),
    activeCount: Number(result.activeCount),
    totalCount: Number(result.totalCount),
  }
}
