import { AppHeader } from "@/components/layout/app-header"
import { SubscriptionForm } from "@/components/subscriptions/subscription-form"
import { getCategories, seedDefaultCategories } from "@/actions/categories"

export default async function NewSubscriptionPage() {
  await seedDefaultCategories()
  const categories = await getCategories()

  return (
    <>
      <AppHeader title="New Subscription" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-lg">
          <SubscriptionForm categories={categories} />
        </div>
      </div>
    </>
  )
}
