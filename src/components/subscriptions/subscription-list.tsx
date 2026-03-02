"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteSubscription, toggleSubscription } from "@/actions/subscriptions"
import { format, differenceInDays } from "date-fns"
import { MoreHorizontal, Pause, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SubscriptionRow {
  subscription: {
    id: string
    name: string
    amount: string
    currency: string
    frequency: string
    nextDueDate: string
    active: boolean
    notes: string | null
  }
  categoryName: string | null
  categoryColor: string | null
}

export function SubscriptionList({
  subscriptions,
}: {
  subscriptions: SubscriptionRow[]
}) {
  const router = useRouter()

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No subscriptions yet.</p>
        <Button
          className="mt-4"
          size="sm"
          onClick={() => router.push("/subscriptions/new")}
        >
          Add your first subscription
        </Button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {subscriptions.map(({ subscription: sub, categoryName, categoryColor }) => {
        const daysUntilDue = differenceInDays(
          new Date(sub.nextDueDate),
          new Date()
        )
        const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0

        return (
          <div
            key={sub.id}
            className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${!sub.active ? "text-muted-foreground line-through" : ""}`}
                >
                  {sub.name}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {sub.frequency}
                </Badge>
                {!sub.active && (
                  <Badge variant="secondary" className="text-[10px]">
                    Paused
                  </Badge>
                )}
                {isDueSoon && sub.active && (
                  <Badge className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20" variant="outline">
                    Due soon
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {categoryName && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: categoryColor ?? "#6b7280" }}
                    />
                    {categoryName}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Next: {format(new Date(sub.nextDueDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="text-sm font-mono font-medium tabular-nums">
              {parseFloat(sub.amount).toLocaleString("en-US", {
                style: "currency",
                currency: sub.currency,
              })}
              <span className="text-xs text-muted-foreground">
                /{sub.frequency === "weekly" ? "wk" : sub.frequency === "monthly" ? "mo" : "yr"}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await toggleSubscription(sub.id)
                      toast.success(
                        sub.active ? "Subscription paused" : "Subscription resumed"
                      )
                    } catch {
                      toast.error("Failed to update")
                    }
                  }}
                >
                  {sub.active ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    try {
                      await deleteSubscription(sub.id)
                      toast.success("Subscription deleted")
                    } catch {
                      toast.error("Failed to delete")
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </div>
  )
}
