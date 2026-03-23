import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  description: string
  formatOptions?: Intl.NumberFormatOptions
  trend?: { current: number; previous: number } | null
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null

  const pct = ((current - previous) / previous) * 100
  const isUp = pct > 0

  if (pct === 0) return null

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        isUp
          ? "bg-red-500/10 text-red-500"
          : "bg-green-500/10 text-green-500"
      }`}
    >
      {isUp ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  formatOptions = { style: "currency", currency: "USD" },
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">
            {value.toLocaleString("en-US", formatOptions)}
          </div>
          {trend && <TrendBadge current={trend.current} previous={trend.previous} />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
