import { AppHeader } from "@/components/layout/app-header"
import { DashboardGrid, type DashboardData } from "@/components/dashboard/dashboard-grid"
import { getExpenseStats } from "@/actions/expenses"
import { getSubscriptionStats } from "@/actions/subscriptions"
import {
  getSpendingByCategory,
  getMonthlySpending,
  getWeeklySpending,
  getYearlySpending,
  getRecentExpenses,
  getUpcomingSubscriptions,
  getLastMonthExpenseStats,
  getRecentInvoices,
} from "@/actions/analytics"
import { seedDefaultCategories, getCategories } from "@/actions/categories"
import { getDashboardLayout } from "@/actions/dashboard-layout"
import { requireSession } from "@/lib/session"

export default async function DashboardPage() {
  const session = await requireSession()
  await seedDefaultCategories()

  const [
    expenseStats,
    subscriptionStats,
    lastMonthStats,
    categorySpending,
    monthlySpending,
    weeklySpending,
    yearlySpending,
    recentExpenses,
    upcomingSubscriptions,
    recentInvoices,
    categories,
    savedLayout,
  ] = await Promise.all([
    getExpenseStats(),
    getSubscriptionStats(),
    getLastMonthExpenseStats(),
    getSpendingByCategory(),
    getMonthlySpending(),
    getWeeklySpending(),
    getYearlySpending(),
    getRecentExpenses(7),
    getUpcomingSubscriptions(),
    getRecentInvoices(),
    getCategories(),
    getDashboardLayout(),
  ])

  const firstName = session.user.name?.split(" ")[0] || "there"

  const data: DashboardData = {
    expenseStats,
    subscriptionStats,
    lastMonthStats,
    categorySpending,
    monthlySpending,
    weeklySpending,
    yearlySpending,
    recentExpenses,
    upcomingSubscriptions,
    recentInvoices,
    categories,
  }

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-4 p-6 pb-2">
        <div>
          <h2 className="text-lg font-semibold">
            Welcome back, {firstName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your spending overview
          </p>
        </div>
      </div>
      <DashboardGrid
        data={data}
        initialLayout={savedLayout?.layout ?? null}
        initialHiddenWidgets={savedLayout?.hiddenWidgets ?? []}
      />
    </>
  )
}
