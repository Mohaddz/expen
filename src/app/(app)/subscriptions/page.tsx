import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getSubscriptions } from "@/actions/subscriptions"
import { SubscriptionList } from "@/components/subscriptions/subscription-list"

export default async function SubscriptionsPage() {
  const subscriptions = await getSubscriptions()

  return (
    <>
      <AppHeader title="Subscriptions">
        <Button asChild size="sm" className="h-8">
          <Link href="/subscriptions/new">
            <Plus className="mr-1 h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </AppHeader>
      <div className="flex-1">
        <SubscriptionList subscriptions={subscriptions} />
      </div>
    </>
  )
}
