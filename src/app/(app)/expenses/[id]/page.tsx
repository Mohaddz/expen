import { AppHeader } from "@/components/layout/app-header"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { getExpenseById } from "@/actions/expenses"
import { getCategories } from "@/actions/categories"
import { notFound } from "next/navigation"

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [result, categories] = await Promise.all([
    getExpenseById(id),
    getCategories(),
  ])

  if (!result) notFound()

  const { expense } = result

  return (
    <>
      <AppHeader title="Edit Expense" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-lg">
          <ExpenseForm
            categories={categories}
            initialData={{
              id: expense.id,
              title: expense.title,
              amount: expense.amount,
              currency: expense.currency,
              date: expense.date,
              categoryId: expense.categoryId,
              notes: expense.notes,
              status: expense.status,
            }}
          />
        </div>
      </div>
    </>
  )
}
