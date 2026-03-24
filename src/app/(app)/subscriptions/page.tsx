import { AppHeader } from "@/components/layout/app-header"
import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { getCustomServices } from "@/actions/custom-services"
import { SubscriptionsDataTable } from "@/components/subscriptions/subscriptions-data-table"
import { CreateSubscriptionDialog } from "@/components/subscriptions/create-subscription-dialog"
import type { Option } from "@/types/data-table"

export default async function SubscriptionsPage() {
  const [{ data: initialData }, categories, customServices] = await Promise.all([
    getSubscriptions({ limit: 20, offset: 0 }),
    getCategories(),
    getCustomServices(),
  ])

  const categoryOptions: Option[] = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
    color: cat.color,
  }))

  return (
    <div className="absolute inset-0 flex flex-col">
      <AppHeader title="Subscriptions">
        <CreateSubscriptionDialog categories={categories} customServices={customServices} />
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
