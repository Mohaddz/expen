"use server"

import { db } from "@/lib/db"
import { expenses, categories, subscriptions, invoices } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { eq, and, sql, gte, lte, desc, inArray } from "drizzle-orm"

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

export async function getWeeklySpending(weeks: number = 8) {
  const session = await requireSession()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeks * 7))

  const result = await db
    .select({
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${expenses.date}::date), 'YYYY-MM-DD')`,
      weekLabel: sql<string>`'W' || EXTRACT(WEEK FROM ${expenses.date}::date)::int`,
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
      sql`DATE_TRUNC('week', ${expenses.date}::date)`,
      sql`EXTRACT(WEEK FROM ${expenses.date}::date)`
    )
    .orderBy(sql`DATE_TRUNC('week', ${expenses.date}::date)`)

  return result.map((r) => ({
    week: r.week,
    label: r.weekLabel,
    total: parseFloat(r.total),
  }))
}

export async function getYearlySpending(years: number = 4) {
  const session = await requireSession()

  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - years + 1)
  startDate.setMonth(0, 1)

  const result = await db
    .select({
      year: sql<string>`TO_CHAR(${expenses.date}::date, 'YYYY')`,
      yearLabel: sql<string>`TO_CHAR(${expenses.date}::date, 'YYYY')`,
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
      sql`TO_CHAR(${expenses.date}::date, 'YYYY')`
    )
    .orderBy(sql`TO_CHAR(${expenses.date}::date, 'YYYY')`)

  return result.map((r) => ({
    year: r.year,
    label: r.yearLabel,
    total: parseFloat(r.total),
  }))
}

export async function getLastMonthExpenseStats() {
  const session = await requireSession()

  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0]
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .split("T")[0]

  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}::numeric), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, session.user.id),
        gte(expenses.date, startOfLastMonth),
        lte(expenses.date, endOfLastMonth)
      )
    )

  return {
    monthlySpend: parseFloat(result.total),
    monthlyCount: Number(result.count),
  }
}

export async function getRecentInvoices(limit: number = 3) {
  const session = await requireSession()

  const result = await db
    .select({
      id: invoices.id,
      fileName: invoices.fileName,
      vendor: invoices.vendor,
      ocrStatus: invoices.ocrStatus,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(eq(invoices.userId, session.user.id))
    .orderBy(desc(invoices.createdAt))
    .limit(limit)

  // Check which invoices have linked expenses
  const invoiceIds = result.map((r) => r.id)
  let linkedExpenses: { invoiceId: string | null }[] = []
  if (invoiceIds.length > 0) {
    linkedExpenses = await db
      .select({ invoiceId: expenses.invoiceId })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, session.user.id),
          inArray(expenses.invoiceId, invoiceIds)
        )
      )
  }

  const linkedSet = new Set(linkedExpenses.map((e) => e.invoiceId))

  return result.map((r) => ({
    ...r,
    hasExpense: linkedSet.has(r.id),
  }))
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
