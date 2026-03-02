"use server"

import { db } from "@/lib/db"
import { expenses, categories } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { expenseSchema } from "@/lib/validators"
import { eq, desc, and, sql, gte, lte, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type ExpenseRow = {
  id: string
  title: string
  amount: number
  currency: string
  date: string
  status: string
  notes: string | null
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  createdAt: Date
}

export async function getExpenses(opts?: { limit?: number; offset?: number }) {
  const session = await requireSession()

  let query = db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: sql<number>`${expenses.amount}::numeric`,
      currency: expenses.currency,
      date: expenses.date,
      status: expenses.status,
      notes: expenses.notes,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(eq(expenses.userId, session.user.id))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))

  if (opts?.limit != null) {
    query = query.limit(opts.limit) as typeof query
  }
  if (opts?.offset != null) {
    query = query.offset(opts.offset) as typeof query
  }

  const rows = await query

  return { data: rows as ExpenseRow[] }
}

export async function getExpenseById(id: string) {
  const session = await requireSession()

  const result = await db
    .select({
      expense: expenses,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)))

  return result[0] || null
}

export async function createExpense(data: unknown) {
  const session = await requireSession()
  const parsed = expenseSchema.parse(data)

  const [created] = await db
    .insert(expenses)
    .values({
      userId: session.user.id,
      title: parsed.title,
      amount: parsed.amount,
      currency: parsed.currency,
      date: parsed.date,
      categoryId: parsed.categoryId || null,
      notes: parsed.notes || null,
      status: parsed.status,
    })
    .returning()

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
  return created
}

export async function updateExpense(id: string, data: unknown) {
  const session = await requireSession()
  const parsed = expenseSchema.parse(data)

  const [updated] = await db
    .update(expenses)
    .set({
      title: parsed.title,
      amount: parsed.amount,
      currency: parsed.currency,
      date: parsed.date,
      categoryId: parsed.categoryId || null,
      notes: parsed.notes || null,
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)))
    .returning()

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
  return updated
}

export async function deleteExpense(id: string) {
  const session = await requireSession()

  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)))

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
}

export async function deleteExpenses(ids: string[]) {
  const session = await requireSession()

  await db
    .delete(expenses)
    .where(and(inArray(expenses.id, ids), eq(expenses.userId, session.user.id)))

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
}

const ALLOWED_EXPENSE_FIELDS = [
  "title",
  "amount",
  "currency",
  "date",
  "categoryId",
  "notes",
  "status",
] as const

export async function updateExpenseField(
  id: string,
  field: string,
  value: string | number | null
) {
  if (!ALLOWED_EXPENSE_FIELDS.includes(field as (typeof ALLOWED_EXPENSE_FIELDS)[number])) {
    throw new Error(`Invalid field: ${field}`)
  }

  const session = await requireSession()

  await db
    .update(expenses)
    .set({ [field]: value, updatedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)))

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
}

export async function getExpenseStats() {
  const session = await requireSession()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0]

  const [totalResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}::numeric), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .where(eq(expenses.userId, session.user.id))

  const [monthResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}::numeric), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, session.user.id),
        gte(expenses.date, startOfMonth),
        lte(expenses.date, endOfMonth)
      )
    )

  return {
    totalSpend: parseFloat(totalResult.total),
    totalCount: Number(totalResult.count),
    monthlySpend: parseFloat(monthResult.total),
    monthlyCount: Number(monthResult.count),
  }
}
