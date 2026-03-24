"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserPreferences } from "@/actions/settings"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
  icon: string | null
}

interface Preferences {
  currency: string
  dateFormat: string
  defaultCategoryId: string | null
  emailNotifications: boolean
  weeklyReport: boolean
}

const CURRENCIES = [
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" },
]

const DATE_FORMATS = [
  { value: "yyyy-MM-dd", label: "2024-03-15" },
  { value: "MM/dd/yyyy", label: "03/15/2024" },
  { value: "dd/MM/yyyy", label: "15/03/2024" },
  { value: "dd-MM-yyyy", label: "15-03-2024" },
]

export function PreferencesSection({
  preferences,
  categories,
}: {
  preferences: Preferences
  categories: Category[]
}) {
  const [currency, setCurrency] = useState(preferences.currency)
  const [dateFormat, setDateFormat] = useState(preferences.dateFormat)
  const [defaultCategoryId, setDefaultCategoryId] = useState(
    preferences.defaultCategoryId ?? "none"
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateUserPreferences({
        currency,
        dateFormat,
        defaultCategoryId: defaultCategoryId === "none" ? null : defaultCategoryId,
        emailNotifications: preferences.emailNotifications,
        weeklyReport: preferences.weeklyReport,
      })
      toast.success("Preferences saved")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Customize your default currency, date format, and categories.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label>Default Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date Format</Label>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Default Category</Label>
          <Select
            value={defaultCategoryId}
            onValueChange={setDefaultCategoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
