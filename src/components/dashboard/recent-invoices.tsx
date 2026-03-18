import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"
import { FileText } from "lucide-react"

interface RecentInvoicesProps {
  invoices: {
    id: string
    fileName: string
    vendor: string | null
    ocrStatus: string
    createdAt: Date
    hasExpense: boolean
  }[]
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  if (invoices.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
        <Link
          href="/upload"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Upload
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center gap-3"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {invoice.vendor || invoice.fileName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(invoice.createdAt), "MMM d")}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${
                  invoice.hasExpense
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : invoice.ocrStatus === "completed"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {invoice.hasExpense
                  ? "Linked"
                  : invoice.ocrStatus === "completed"
                    ? "Pending"
                    : invoice.ocrStatus === "processing"
                      ? "Processing"
                      : "Uploaded"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
