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

  const [{ data }, categories] = await Promise.all([
    getExpenses(),
    getCategories(),
  ])

  const categoryOptions: Option[] = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))

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
      <div className="flex-1 overflow-auto">
        <ExpensesDataTable
          data={data}
          categoryOptions={categoryOptions}
        />
      </div>
    </>
  )
}
