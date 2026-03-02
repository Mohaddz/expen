import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getExpenses } from "@/actions/expenses"
import { getCategories, seedDefaultCategories } from "@/actions/categories"
import { ExpenseList } from "@/components/expenses/expense-list"
import { ExpenseFilters } from "@/components/expenses/expense-filters"

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
  }>
}) {
  const params = await searchParams
  await seedDefaultCategories()
  const [expenses, categories] = await Promise.all([
    getExpenses({
      search: params.search,
      status: params.status,
      categoryId: params.category,
    }),
    getCategories(),
  ])

  return (
    <>
      <AppHeader title="Expenses">
        <Button asChild size="sm" className="h-8">
          <Link href="/expenses/new">
            <Plus className="mr-1 h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </AppHeader>
      <div className="flex-1">
        <div className="border-b px-4 py-3">
          <ExpenseFilters categories={categories} />
        </div>
        <ExpenseList expenses={expenses} />
      </div>
    </>
  )
}
