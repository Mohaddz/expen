import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays } from "date-fns"
import Link from "next/link"

interface UpcomingSubscriptionsProps {
  subscriptions: {
    subscription: {
      id: string
      name: string
      amount: string
      currency: string
      nextDueDate: string
      frequency: string
    }
    categoryName: string | null
    categoryColor: string | null
  }[]
}

export function UpcomingSubscriptions({
  subscriptions,
}: UpcomingSubscriptionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          Upcoming Subscriptions
        </CardTitle>
        <Link
          href="/subscriptions"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active subscriptions.
          </p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(({ subscription: sub, categoryColor }) => {
              const daysUntil = differenceInDays(
                new Date(sub.nextDueDate),
                new Date()
              )

              return (
                <div key={sub.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sub.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(sub.nextDueDate), "MMM d")}
                      </span>
                      {daysUntil <= 3 && daysUntil >= 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20"
                        >
                          {daysUntil === 0
                            ? "Today"
                            : `${daysUntil}d`}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-medium tabular-nums ml-4">
                    {parseFloat(sub.amount).toLocaleString("en-US", {
                      style: "currency",
                      currency: sub.currency,
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
