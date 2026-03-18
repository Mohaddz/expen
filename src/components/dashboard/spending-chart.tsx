"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type Period = "weekly" | "monthly" | "yearly"

interface SpendingChartProps {
  monthlyData: { month: string; label: string; total: number }[]
  weeklyData: { week: string; label: string; total: number }[]
  yearlyData: { year: string; label: string; total: number }[]
}

const chartConfig = {
  total: {
    label: "Spending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const periods: { value: Period; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

export function SpendingChart({ monthlyData, weeklyData, yearlyData }: SpendingChartProps) {
  const [period, setPeriod] = useState<Period>("monthly")

  const data =
    period === "weekly"
      ? weeklyData
      : period === "yearly"
        ? yearlyData
        : monthlyData

  const totalForPeriod = data.reduce((sum, d) => sum + d.total, 0)

  const isEmpty = monthlyData.length === 0 && weeklyData.length === 0 && yearlyData.length === 0

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data yet. Add expenses to see trends.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Spending</CardTitle>
          <p className="text-2xl font-bold mt-1">
            {totalForPeriod.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>
        </div>
        <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-0 pb-3">
        <p className="text-xs text-muted-foreground">
          {period === "weekly"
            ? "Last 8 weeks"
            : period === "yearly"
              ? "Year over year"
              : "Last 6 months"}
        </p>
      </CardFooter>
    </Card>
  )
}
