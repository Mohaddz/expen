import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import Link from "next/link"

interface RecentExpensesProps {
  expenses: {
    expense: {
      id: string
      title: string
      amount: string
      currency: string
      date: string
    }
    categoryName: string | null
    categoryColor: string | null
  }[]
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Recent Expenses</CardTitle>
        <Link
          href="/expenses"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No expenses yet.
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.map(({ expense, categoryName, categoryColor }) => (
              <div
                key={expense.id}
                className="flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {expense.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {categoryName && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: categoryColor ?? "#6b7280",
                          }}
                        />
                        {categoryName}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(expense.date), "MMM d")}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-mono font-medium tabular-nums ml-4">
                  {parseFloat(expense.amount).toLocaleString("en-US", {
                    style: "currency",
                    currency: expense.currency,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
