"use server"

import { db } from "@/lib/db"
import { subscriptions, categories } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { subscriptionSchema } from "@/lib/validators"
import { eq, and, desc, sql, inArray } from "drizzle-orm"
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

export type SubscriptionRow = {
  id: string
  name: string
  amount: number
  currency: string
  frequency: string
  nextDueDate: string
  active: boolean
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
}

export async function getSubscriptions(opts?: {
  limit?: number
  offset?: number
}) {
  const session = await requireSession()

  let query = db
    .select({
      id: subscriptions.id,
      name: subscriptions.name,
      amount: sql<number>`${subscriptions.amount}::numeric`,
      currency: subscriptions.currency,
      frequency: subscriptions.frequency,
      nextDueDate: subscriptions.nextDueDate,
      active: subscriptions.active,
      categoryId: subscriptions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(subscriptions)
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .where(eq(subscriptions.userId, session.user.id))
    .orderBy(desc(subscriptions.active), subscriptions.nextDueDate)

  if (opts?.limit != null) {
    query = query.limit(opts.limit) as typeof query
  }
  if (opts?.offset != null) {
    query = query.offset(opts.offset) as typeof query
  }

  const rows = await query

  return { data: rows as SubscriptionRow[] }
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

export async function deleteSubscriptions(ids: string[]) {
  const session = await requireSession()

  await db
    .delete(subscriptions)
    .where(
      and(
        inArray(subscriptions.id, ids),
        eq(subscriptions.userId, session.user.id)
      )
    )

  revalidatePath("/subscriptions")
  revalidatePath("/dashboard")
}

const ALLOWED_SUBSCRIPTION_FIELDS = [
  "name",
  "amount",
  "currency",
  "frequency",
  "startDate",
  "nextDueDate",
  "categoryId",
  "notes",
  "active",
] as const

export async function updateSubscriptionField(
  id: string,
  field: string,
  value: string | number | boolean | null
) {
  if (
    !ALLOWED_SUBSCRIPTION_FIELDS.includes(
      field as (typeof ALLOWED_SUBSCRIPTION_FIELDS)[number]
    )
  ) {
    throw new Error(`Invalid field: ${field}`)
  }

  const session = await requireSession()

  await db
    .update(subscriptions)
    .set({ [field]: value, updatedAt: new Date() })
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
