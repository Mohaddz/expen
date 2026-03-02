import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getExpenses } from "@/actions/expenses"
import { getCategories, seedDefaultCategories } from "@/actions/categories"
import { ExpensesDataTable } from "@/components/expenses/expenses-data-table"
import type { Option } from "@/types/data-table"

export default async function ExpensesPage() {
  await seedDefaultCategories()

  const [{ data: initialData }, categories] = await Promise.all([
    getExpenses({ limit: 20, offset: 0 }),
    getCategories(),
  ])

  const categoryOptions: Option[] = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
    color: cat.color,
  }))

  return (
    <div className="absolute inset-0 flex flex-col">
      <AppHeader title="Expenses">
        <Button asChild size="sm" className="h-8">
          <Link href="/expenses/new">
            <Plus className="mr-1 h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </AppHeader>
      <div className="min-h-0 flex-1">
        <ExpensesDataTable
          initialData={initialData}
          categoryOptions={categoryOptions}
        />
      </div>
    </div>
  )
}
