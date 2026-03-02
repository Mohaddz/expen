import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { SubscriptionsDataTable } from "@/components/subscriptions/subscriptions-data-table"
import type { Option } from "@/types/data-table"

export default async function SubscriptionsPage() {
  const [{ data: initialData }, categories] = await Promise.all([
    getSubscriptions({ limit: 20, offset: 0 }),
    getCategories(),
  ])

  const categoryOptions: Option[] = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
    color: cat.color,
  }))

  return (
    <div className="absolute inset-0 flex flex-col">
      <AppHeader title="Subscriptions">
        <Button asChild size="sm" className="h-8">
          <Link href="/subscriptions/new">
            <Plus className="mr-1 h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </AppHeader>
      <div className="min-h-0 flex-1">
        <SubscriptionsDataTable
          initialData={initialData}
          categoryOptions={categoryOptions}
        />
      </div>
    </div>
  )
}
