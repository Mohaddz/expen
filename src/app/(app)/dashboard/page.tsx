import { AppHeader } from "@/components/layout/app-header"
import { StatCards } from "@/components/dashboard/stat-cards"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { RecentExpenses } from "@/components/dashboard/recent-expenses"
import { UpcomingSubscriptions } from "@/components/dashboard/upcoming-subscriptions"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { QuickUpload } from "@/components/dashboard/quick-upload"
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
  ])

  const firstName = session.user.name?.split(" ")[0] || "there"

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Welcome back, {firstName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your spending overview
          </p>
        </div>

        <StatCards
          totalSpend={expenseStats.totalSpend}
          monthlySpend={expenseStats.monthlySpend}
          monthlyCount={expenseStats.monthlyCount}
          subscriptionMonthly={subscriptionStats.monthlyTotal}
          activeSubscriptions={subscriptionStats.activeCount}
          lastMonthSpend={lastMonthStats.monthlySpend}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <SpendingChart
            monthlyData={monthlySpending}
            weeklyData={weeklySpending}
            yearlyData={yearlySpending}
          />
          <CategoryChart data={categorySpending} />
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <RecentExpenses expenses={recentExpenses} />
          </div>
          <div className="md:col-span-2 space-y-6">
            <UpcomingSubscriptions subscriptions={upcomingSubscriptions} />
            <RecentInvoices invoices={recentInvoices} />
            <QuickUpload categories={categories} />
          </div>
        </div>
      </div>
    </>
  )
}
