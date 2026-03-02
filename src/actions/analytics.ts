"use server"

import { db } from "@/lib/db"
import { expenses, categories, subscriptions } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { eq, and, sql, gte, lte, desc } from "drizzle-orm"

export async function getSpendingByCategory(startDate?: string, endDate?: string) {
  const session = await requireSession()

  const conditions = [eq(expenses.userId, session.user.id)]
  if (startDate) conditions.push(gte(expenses.date, startDate))
  if (endDate) conditions.push(lte(expenses.date, endDate))

  const result = await db
    .select({
      categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      categoryColor: sql<string>`COALESCE(${categories.color}, '#6b7280')`,
      total: sql<string>`SUM(${expenses.amount}::numeric)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(...conditions))
    .groupBy(categories.name, categories.color)
    .orderBy(sql`SUM(${expenses.amount}::numeric) DESC`)

  return result.map((r) => ({
    name: r.categoryName,
    color: r.categoryColor,
    total: parseFloat(r.total),
    count: Number(r.count),
  }))
}

export async function getMonthlySpending(months: number = 6) {
  const session = await requireSession()

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months + 1)
  startDate.setDate(1)

  const result = await db
    .select({
      month: sql<string>`TO_CHAR(${expenses.date}::date, 'YYYY-MM')`,
      monthLabel: sql<string>`TO_CHAR(${expenses.date}::date, 'Mon')`,
      total: sql<string>`SUM(${expenses.amount}::numeric)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, session.user.id),
        gte(expenses.date, startDate.toISOString().split("T")[0])
      )
    )
    .groupBy(
      sql`TO_CHAR(${expenses.date}::date, 'YYYY-MM')`,
      sql`TO_CHAR(${expenses.date}::date, 'Mon')`
    )
    .orderBy(sql`TO_CHAR(${expenses.date}::date, 'YYYY-MM')`)

  return result.map((r) => ({
    month: r.month,
    label: r.monthLabel,
    total: parseFloat(r.total),
  }))
}

export async function getRecentExpenses(limit: number = 5) {
  const session = await requireSession()

  return db
    .select({
      expense: expenses,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(eq(expenses.userId, session.user.id))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))
    .limit(limit)
}

export async function getUpcomingSubscriptions(limit: number = 5) {
  const session = await requireSession()

  return db
    .select({
      subscription: subscriptions,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(subscriptions)
    .leftJoin(categories, eq(subscriptions.categoryId, categories.id))
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.active, true)
      )
    )
    .orderBy(subscriptions.nextDueDate)
    .limit(limit)
}
