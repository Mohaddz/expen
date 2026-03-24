"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { exportUserData } from "@/actions/settings"
import { DeleteAccountCard } from "@daveyplate/better-auth-ui"
import { toast } from "sonner"
import { Download, Loader2 } from "lucide-react"

export function DataSection() {
  const [exporting, setExporting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleExport() {
    setExporting(true)
    try {
      const data = await exportUserData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `expenseer-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Data exported successfully")
    } catch {
      toast.error("Failed to export data")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Data & Account</h2>
        <p className="text-sm text-muted-foreground">
          Export your data or manage your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Data</CardTitle>
          <CardDescription>
            Download all your expenses, subscriptions, categories, and invoices
            as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export All Data
          </Button>
        </CardContent>
      </Card>

      {mounted ? (
        <DeleteAccountCard />
      ) : (
        <div className="h-32 animate-pulse rounded-xl border bg-card" />
      )}
    </div>
  )
}
