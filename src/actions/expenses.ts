"use server"

import { db } from "@/lib/db"
import { expenses, categories } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { expenseSchema } from "@/lib/validators"
import { eq, desc, and, sql, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getExpenses(filters?: {
  search?: string
  categoryId?: string
  status?: string
  startDate?: string
  endDate?: string
}) {
  const session = await requireSession()

  const conditions = [eq(expenses.userId, session.user.id)]

  if (filters?.categoryId) {
    conditions.push(eq(expenses.categoryId, filters.categoryId))
  }
  if (filters?.status) {
    conditions.push(eq(expenses.status, filters.status))
  }
  if (filters?.startDate) {
    conditions.push(gte(expenses.date, filters.startDate))
  }
  if (filters?.endDate) {
    conditions.push(lte(expenses.date, filters.endDate))
  }

  const result = await db
    .select({
      expense: expenses,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))

  if (filters?.search) {
    const search = filters.search.toLowerCase()
    return result.filter(
      (r) =>
        r.expense.title.toLowerCase().includes(search) ||
        r.expense.notes?.toLowerCase().includes(search)
    )
  }

  return result
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
