import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Budget Tracker</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          Track expenses, upload invoices, manage subscriptions. Simple, fast,
          self-hostable.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/auth/sign-in">Sign In</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/sign-up">Sign Up</Link>
        </Button>
      </div>
    </div>
  )
}
