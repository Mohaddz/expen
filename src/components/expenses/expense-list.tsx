"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteExpense } from "@/actions/expenses"
import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ExpenseRow {
  expense: {
    id: string
    title: string
    amount: string
    currency: string
    date: string
    status: string
    notes: string | null
  }
  categoryName: string | null
  categoryColor: string | null
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function ExpenseList({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter()

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No expenses yet.</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/expenses/new">Add your first expense</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {expenses.map(({ expense, categoryName, categoryColor }) => (
        <div
          key={expense.id}
          className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer"
          onClick={() => router.push(`/expenses/${expense.id}`)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {expense.title}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] ${statusStyles[expense.status] ?? ""}`}
              >
                {expense.status}
              </Badge>
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
                {format(new Date(expense.date), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          <div className="text-sm font-mono font-medium tabular-nums">
            {parseFloat(expense.amount).toLocaleString("en-US", {
              style: "currency",
              currency: expense.currency,
            })}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/expenses/${expense.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    await deleteExpense(expense.id)
                    toast.success("Expense deleted")
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
      ))}
    </div>
  )
}
