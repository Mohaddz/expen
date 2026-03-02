import { AppHeader } from "@/components/layout/app-header"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import {
  getSpendingByCategory,
  getMonthlySpending,
} from "@/actions/analytics"
import { getExpenses } from "@/actions/expenses"

export default async function AnalyticsPage() {
  const [categoryData, monthlyData, expenses] = await Promise.all([
    getSpendingByCategory(),
    getMonthlySpending(12),
    getExpenses(),
  ])

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
