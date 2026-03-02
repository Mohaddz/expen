import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, RefreshCw, Receipt } from "lucide-react"

interface StatCardsProps {
  totalSpend: number
  monthlySpend: number
  monthlyCount: number
  subscriptionMonthly: number
  activeSubscriptions: number
}

export function StatCards({
  totalSpend,
  monthlySpend,
  monthlyCount,
  subscriptionMonthly,
  activeSubscriptions,
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
    },
    {
      title: "This Month",
      value: monthlySpend.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      icon: TrendingUp,
      description: `${monthlyCount} expense${monthlyCount !== 1 ? "s" : ""}`,
    },
    {
      title: "Subscriptions",
      value: subscriptionMonthly.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      icon: RefreshCw,
      description: `${activeSubscriptions} active / month`,
    },
    {
      title: "Monthly Total",
      value: (monthlySpend + subscriptionMonthly).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      icon: Receipt,
      description: "Expenses + subs",
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
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
