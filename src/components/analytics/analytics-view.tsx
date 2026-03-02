"use client"

import { useState } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface AnalyticsViewProps {
  monthlyData: { month: string; label: string; total: number }[]
  categoryData: { name: string; color: string; total: number; count: number }[]
  expenses: {
    expense: {
      id: string
      title: string
      amount: string
      currency: string
      date: string
      status: string
    }
    categoryName: string | null
    categoryColor: string | null
  }[]
}

const barConfig = {
  total: { label: "Spending", color: "var(--chart-1)" },
} satisfies ChartConfig

const lineConfig = {
  total: { label: "Spending", color: "var(--chart-2)" },
} satisfies ChartConfig

export function AnalyticsView({
  monthlyData,
  categoryData,
  expenses,
}: AnalyticsViewProps) {
  const pieConfig = Object.fromEntries(
    categoryData.map((d) => [d.name, { label: d.name, color: d.color }])
  ) satisfies ChartConfig

  const handleExport = () => {
    const headers = ["Date", "Title", "Amount", "Currency", "Category", "Status"]
    const rows = expenses.map((r) => [
      r.expense.date,
      r.expense.title,
      r.expense.amount,
      r.expense.currency,
      r.categoryName || "Uncategorized",
      r.expense.status,
    ])

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="outline" size="sm" onClick={handleExport} className="h-8">
          <Download className="mr-2 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="bar">
        <TabsList>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
        </TabsList>
        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Monthly Spending Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No data available yet.
                </p>
              ) : (
                <ChartContainer config={barConfig} className="h-[300px] w-full">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Monthly Spending Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No data available yet.
                </p>
              ) : (
                <ChartContainer config={lineConfig} className="h-[300px] w-full">
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--color-total)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data yet.
              </p>
            ) : (
              <div className="flex items-center gap-6">
                <ChartContainer config={pieConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-2">
                  {categoryData.map((item) => {
                    const total = categoryData.reduce((s, d) => s + d.total, 0)
                    const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : "0"
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">{pct}%</span>
                          <span className="font-mono font-medium">${item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold">{categoryData.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average per Expense</p>
                <p className="text-2xl font-bold">
                  {expenses.length > 0
                    ? (
                        expenses.reduce(
                          (s, r) => s + parseFloat(r.expense.amount),
                          0
                        ) / expenses.length
                      ).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "$0.00"}
                </p>
              </div>
              {monthlyData.length >= 2 && (
                <div>
                  <p className="text-xs text-muted-foreground">Month-over-Month</p>
                  {(() => {
                    const curr = monthlyData[monthlyData.length - 1]?.total ?? 0
                    const prev = monthlyData[monthlyData.length - 2]?.total ?? 0
                    const change = prev > 0 ? ((curr - prev) / prev) * 100 : 0
                    return (
                      <p
                        className={`text-2xl font-bold ${
                          change > 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </p>
                    )
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
