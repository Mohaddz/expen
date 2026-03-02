import { AuthView, authViewPaths } from "@daveyplate/better-auth-ui"

export function generateStaticParams() {
  return Object.values(authViewPaths).map((pathname) => ({ pathname: [pathname] }))
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ pathname: string[] }>
}) {
  const { pathname } = await params

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Budget Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Track your expenses, upload invoices, manage subscriptions.
        </p>
      </div>
      <AuthView pathname={pathname.join("/")} redirectTo="/dashboard" />
    </div>
  )
}
