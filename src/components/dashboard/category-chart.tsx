"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface CategoryChartProps {
  data: { name: string; color: string; total: number; count: number }[]
}

const chartConfig = {
  total: {
    label: "Spending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const topCategories = data.slice(0, 8)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-[280px] w-full"
        >
          <RadarChart data={topCategories} outerRadius="70%" cx="50%" cy="50%">
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
            />
            <PolarGrid />
            <Radar
              dataKey="total"
              fill="var(--color-total)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
