import { AppHeader } from "@/components/layout/app-header"
import { StatCards } from "@/components/dashboard/stat-cards"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { RecentExpenses } from "@/components/dashboard/recent-expenses"
import { UpcomingSubscriptions } from "@/components/dashboard/upcoming-subscriptions"
import { getExpenseStats } from "@/actions/expenses"
import { getSubscriptionStats } from "@/actions/subscriptions"
import {
  getSpendingByCategory,
  getMonthlySpending,
  getRecentExpenses,
  getUpcomingSubscriptions,
} from "@/actions/analytics"
import { seedDefaultCategories } from "@/actions/categories"

export default async function DashboardPage() {
  await seedDefaultCategories()

  const [
    expenseStats,
    subscriptionStats,
    categorySpending,
    monthlySpending,
    recentExpenses,
    upcomingSubscriptions,
  ] = await Promise.all([
    getExpenseStats(),
    getSubscriptionStats(),
    getSpendingByCategory(),
    getMonthlySpending(),
    getRecentExpenses(),
    getUpcomingSubscriptions(),
  ])

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">
        <StatCards
          totalSpend={expenseStats.totalSpend}
          monthlySpend={expenseStats.monthlySpend}
          monthlyCount={expenseStats.monthlyCount}
          subscriptionMonthly={subscriptionStats.monthlyTotal}
          activeSubscriptions={subscriptionStats.activeCount}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <SpendingChart data={monthlySpending} />
          <CategoryChart data={categorySpending} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RecentExpenses expenses={recentExpenses} />
          <UpcomingSubscriptions subscriptions={upcomingSubscriptions} />
        </div>
      </div>
    </>
  )
}
