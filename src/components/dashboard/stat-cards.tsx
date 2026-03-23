import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Receipt } from "lucide-react"

interface StatCardsProps {
  totalSpend: number
  monthlySpend: number
  monthlyCount: number
  subscriptionMonthly: number
  activeSubscriptions: number
  lastMonthSpend?: number
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null

  const pct = ((current - previous) / previous) * 100
  const isUp = pct > 0
  const isNeutral = pct === 0

  if (isNeutral) return null

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        isUp
          ? "bg-red-500/10 text-red-500"
          : "bg-green-500/10 text-green-500"
      }`}
    >
      {isUp ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

export function StatCards({
  totalSpend,
  monthlySpend,
  monthlyCount,
  subscriptionMonthly,
  activeSubscriptions,
  lastMonthSpend,
}: StatCardsProps) {
  const cards = [
    {
      title: "Total Spent",
      value: totalSpend.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      icon: DollarSign,
      description: "All time",
      trend: null as React.ReactNode,
    },
    {
      title: "This Month",
      value: monthlySpend.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      icon: TrendingUp,
      description: `${monthlyCount} expense${monthlyCount !== 1 ? "s" : ""}`,
      trend:
        lastMonthSpend != null ? (
          <TrendBadge current={monthlySpend} previous={lastMonthSpend} />
        ) : null,
    },
    {
      title: "Subscriptions",
      value: subscriptionMonthly.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      icon: RefreshCw,
      description: `${activeSubscriptions} active / month`,
      trend: null as React.ReactNode,
    },
    {
      title: "Monthly Total",
      value: (monthlySpend + subscriptionMonthly).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      icon: Receipt,
      description: "Expenses + subs",
      trend:
        lastMonthSpend != null ? (
          <TrendBadge
            current={monthlySpend + subscriptionMonthly}
            previous={lastMonthSpend + subscriptionMonthly}
          />
        ) : null,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{card.value}</div>
              {card.trend}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
