"use client"

import { useState, useEffect } from "react"
import {
  ChangePasswordCard,
  SessionsCard,
} from "@daveyplate/better-auth-ui"

export function SecuritySection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="text-sm text-muted-foreground">
            Manage your password and active sessions.
          </p>
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border bg-card"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Manage your password and active sessions.
        </p>
      </div>
      <ChangePasswordCard />
      <SessionsCard />
    </div>
  )
}
