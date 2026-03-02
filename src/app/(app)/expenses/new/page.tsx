import { AppHeader } from "@/components/layout/app-header"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { getCategories, seedDefaultCategories } from "@/actions/categories"

export default async function NewExpensePage() {
  await seedDefaultCategories()
  const categories = await getCategories()

  return (
    <>
      <AppHeader title="New Expense" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-lg">
          <ExpenseForm categories={categories} />
        </div>
      </div>
    </>
  )
}
