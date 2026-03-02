import { AppHeader } from "@/components/layout/app-header"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import {
  getSpendingByCategory,
  getMonthlySpending,
} from "@/actions/analytics"
import { getExpenses } from "@/actions/expenses"

export default async function AnalyticsPage() {
  const [categoryData, monthlyData, { data: expenseRows }] = await Promise.all([
    getSpendingByCategory(),
    getMonthlySpending(12),
    getExpenses(),
  ])

  const expenses = expenseRows.map((row) => ({
    expense: {
      id: row.id,
      title: row.title,
      amount: String(row.amount),
      currency: row.currency,
      date: row.date,
      status: row.status,
    },
    categoryName: row.categoryName,
    categoryColor: row.categoryColor,
  }))

  return (
    <>
      <AppHeader title="Analytics" />
      <div className="flex-1 p-6">
        <AnalyticsView
          monthlyData={monthlyData}
          categoryData={categoryData}
          expenses={expenses}
        />
      </div>
    </>
  )
}
