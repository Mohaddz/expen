"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateUserPreferences } from "@/actions/settings"
import { toast } from "sonner"

interface Preferences {
  currency: string
  dateFormat: string
  defaultCategoryId: string | null
  emailNotifications: boolean
  weeklyReport: boolean
}

export function NotificationsSection({
  preferences,
}: {
  preferences: Preferences
}) {
  const [emailNotifications, setEmailNotifications] = useState(
    preferences.emailNotifications
  )
  const [weeklyReport, setWeeklyReport] = useState(preferences.weeklyReport)

  async function handleToggle(
    field: "emailNotifications" | "weeklyReport",
    value: boolean
  ) {
    const prev = { emailNotifications, weeklyReport }
    if (field === "emailNotifications") setEmailNotifications(value)
    else setWeeklyReport(value)

    try {
      await updateUserPreferences({
        currency: preferences.currency,
        dateFormat: preferences.dateFormat,
        defaultCategoryId: preferences.defaultCategoryId,
        emailNotifications:
          field === "emailNotifications" ? value : emailNotifications,
        weeklyReport: field === "weeklyReport" ? value : weeklyReport,
      })
      toast.success("Notification preference updated")
    } catch {
      // Revert on error
      if (field === "emailNotifications")
        setEmailNotifications(prev.emailNotifications)
      else setWeeklyReport(prev.weeklyReport)
      toast.error("Failed to update preference")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Configure your email notification preferences.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Email Notifications</Label>
            <p className="text-xs text-muted-foreground">
              Receive email notifications about your account activity.
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={(v) => handleToggle("emailNotifications", v)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Weekly Report</Label>
            <p className="text-xs text-muted-foreground">
              Get a weekly summary of your spending and subscriptions.
            </p>
          </div>
          <Switch
            checked={weeklyReport}
            onCheckedChange={(v) => handleToggle("weeklyReport", v)}
          />
        </div>
      </div>
    </div>
  )
}
