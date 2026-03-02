"use client"

import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthUIProvider
        authClient={authClient}
        navigate={router.push}
        replace={router.replace}
        onSessionChange={() => router.refresh()}
        redirectTo="/dashboard"
        Link={Link}
      >
        <NuqsAdapter>
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </NuqsAdapter>
      </AuthUIProvider>
    </ThemeProvider>
  )
}
