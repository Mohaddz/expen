"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GridLayout, useContainerWidth } from "react-grid-layout"
import type { Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import { Button } from "@/components/ui/button"
import { Settings2, RotateCcw, DollarSign, TrendingUp, RefreshCw, Receipt } from "lucide-react"
import { saveDashboardLayout, resetDashboardLayout } from "@/actions/dashboard-layout"
import { WidgetWrapper } from "./widget-wrapper"
import { AddWidgetDialog } from "./add-widget-dialog"
import { DEFAULT_LAYOUT, WIDGET_REGISTRY } from "./widget-registry"
import { StatCard } from "./stat-card"
import { SpendingChart } from "./spending-chart"
import { CategoryChart } from "./category-chart"
import { RecentExpenses } from "./recent-expenses"
import { UpcomingSubscriptions } from "./upcoming-subscriptions"
import { RecentInvoices } from "./recent-invoices"
import { QuickUpload } from "./quick-upload"

export interface DashboardData {
  expenseStats: {
    totalSpend: number
    monthlySpend: number
    monthlyCount: number
  }
  subscriptionStats: {
    monthlyTotal: number
    activeCount: number
  }
  lastMonthStats: {
    monthlySpend: number
  }
  categorySpending: { name: string; color: string; total: number; count: number }[]
  monthlySpending: { month: string; label: string; total: number }[]
  weeklySpending: { week: string; label: string; total: number }[]
  yearlySpending: { year: string; label: string; total: number }[]
  recentExpenses: {
    expense: {
      id: string
      title: string
      amount: string
      currency: string
      date: string
    }
    categoryName: string | null
    categoryColor: string | null
  }[]
  upcomingSubscriptions: {
    subscription: {
      id: string
      name: string
      amount: string
      currency: string
      nextDueDate: string
      frequency: string
    }
    categoryName: string | null
    categoryColor: string | null
  }[]
  recentInvoices: {
    id: string
    fileName: string
    vendor: string | null
    ocrStatus: string
    createdAt: Date
    hasExpense: boolean
  }[]
  categories: { id: string; name: string; color: string }[]
}

interface DashboardGridProps {
  data: DashboardData
  initialLayout: Layout[] | null
  initialHiddenWidgets: string[]
}

function renderWidget(widgetId: string, data: DashboardData) {
  switch (widgetId) {
    case "stat-total-spent":
      return (
        <StatCard
          title="Total Spent"
          value={data.expenseStats.totalSpend}
          icon={DollarSign}
          description="All time"
        />
      )
    case "stat-this-month":
      return (
        <StatCard
          title="This Month"
          value={data.expenseStats.monthlySpend}
          icon={TrendingUp}
          description={`${data.expenseStats.monthlyCount} expense${data.expenseStats.monthlyCount !== 1 ? "s" : ""}`}
          trend={
            data.lastMonthStats.monthlySpend != null
              ? { current: data.expenseStats.monthlySpend, previous: data.lastMonthStats.monthlySpend }
              : null
          }
        />
      )
    case "stat-subscriptions":
      return (
        <StatCard
          title="Subscriptions"
          value={data.subscriptionStats.monthlyTotal}
          icon={RefreshCw}
          description={`${data.subscriptionStats.activeCount} active / month`}
        />
      )
    case "stat-monthly-total":
      return (
        <StatCard
          title="Monthly Total"
          value={data.expenseStats.monthlySpend + data.subscriptionStats.monthlyTotal}
          icon={Receipt}
          description="Expenses + subs"
          trend={
            data.lastMonthStats.monthlySpend != null
              ? {
                  current: data.expenseStats.monthlySpend + data.subscriptionStats.monthlyTotal,
                  previous: data.lastMonthStats.monthlySpend + data.subscriptionStats.monthlyTotal,
                }
              : null
          }
        />
      )
    case "spending-chart":
      return (
        <SpendingChart
          monthlyData={data.monthlySpending}
          weeklyData={data.weeklySpending}
          yearlyData={data.yearlySpending}
        />
      )
    case "category-chart":
      return <CategoryChart data={data.categorySpending} />
    case "recent-expenses":
      return <RecentExpenses expenses={data.recentExpenses} />
    case "upcoming-subscriptions":
      return <UpcomingSubscriptions subscriptions={data.upcomingSubscriptions} />
    case "recent-invoices":
      return <RecentInvoices invoices={data.recentInvoices} />
    case "quick-upload":
      return <QuickUpload categories={data.categories} />
    default:
      return null
  }
}

export function DashboardGrid({
  data,
  initialLayout,
  initialHiddenWidgets,
}: DashboardGridProps) {
  const [layouts, setLayouts] = useState<Layout[]>(() => {
    if (!initialLayout) return DEFAULT_LAYOUT
    // Migrate old "stat-cards" grouped widget to individual stat widgets
    const hasOldStatCards = initialLayout.some((l) => l.i === "stat-cards")
    if (hasOldStatCards) return DEFAULT_LAYOUT
    return initialLayout
  })
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(
    initialHiddenWidgets
  )
  const [isEditing, setIsEditing] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { containerRef, width } = useContainerWidth()

  const visibleLayouts = layouts.filter((l) => !hiddenWidgets.includes(l.i))

  // Apply min/max constraints from registry
  // Use numeric string indices as layout `i` to avoid React 19 key prefix issues
  const widgetOrder = visibleLayouts.map((l) => l.i)
  const constrainedLayouts = visibleLayouts.map((l, idx) => {
    const def = WIDGET_REGISTRY.find((w) => w.id === l.i)
    return {
      ...l,
      i: String(idx),
      minW: def?.defaultLayout.minW,
      minH: def?.defaultLayout.minH,
      maxW: def?.defaultLayout.maxW,
      maxH: def?.defaultLayout.maxH,
    }
  })

  const debouncedSave = useCallback(
    (newLayouts: Layout[], newHidden: string[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveDashboardLayout(
          newLayouts.map((l) => ({
            i: l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h,
          })),
          newHidden
        )
      }, 500)
    },
    []
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      // Map numeric indices back to widget IDs
      const updated = layouts.map((existing) => {
        const idx = widgetOrder.indexOf(existing.i)
        if (idx === -1) return existing
        const changed = newLayout.find((l) => l.i === String(idx))
        if (changed) {
          return { ...existing, x: changed.x, y: changed.y, w: changed.w, h: changed.h }
        }
        return existing
      })
      setLayouts(updated)
      debouncedSave(updated, hiddenWidgets)
    },
    [layouts, hiddenWidgets, widgetOrder, debouncedSave]
  )

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      const newHidden = [...hiddenWidgets, widgetId]
      setHiddenWidgets(newHidden)
      debouncedSave(layouts, newHidden)
    },
    [hiddenWidgets, layouts, debouncedSave]
  )

  const handleAddWidget = useCallback(
    (widgetId: string) => {
      const newHidden = hiddenWidgets.filter((id) => id !== widgetId)
      setHiddenWidgets(newHidden)

      // Add back with default layout if not already in layouts
      const exists = layouts.find((l) => l.i === widgetId)
      if (!exists) {
        const def = WIDGET_REGISTRY.find((w) => w.id === widgetId)
        if (def) {
          const newLayout = [
            ...layouts,
            { i: widgetId, x: 0, y: Infinity, w: def.defaultLayout.w, h: def.defaultLayout.h },
          ]
          setLayouts(newLayout)
          debouncedSave(newLayout, newHidden)
          return
        }
      }

      debouncedSave(layouts, newHidden)
    },
    [hiddenWidgets, layouts, debouncedSave]
  )

  const handleReset = useCallback(async () => {
    setLayouts(DEFAULT_LAYOUT)
    setHiddenWidgets([])
    await resetDashboardLayout()
  }, [])

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-end gap-2 px-6 pt-2">
        {isEditing && (
          <>
            <AddWidgetDialog
              hiddenWidgets={hiddenWidgets}
              onAdd={handleAddWidget}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          </>
        )}
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
          {isEditing ? "Done" : "Customize"}
        </Button>
      </div>

      {width > 0 && (
        <GridLayout
          className="layout"
          width={width}
          layout={constrainedLayouts}
          gridConfig={{
            cols: 12,
            rowHeight: 80,
            margin: [16, 16] as [number, number],
            containerPadding: [24, 0] as [number, number],
          }}
          dragConfig={{
            enabled: isEditing,
            handle: ".drag-handle",
          }}
          resizeConfig={{
            enabled: isEditing,
          }}
          onLayoutChange={handleLayoutChange}
        >
          {constrainedLayouts.map((item, idx) => (
            <div key={String(idx)} className="overflow-hidden [&>*:first-child]:h-full [&>*:first-child>*:last-child]:h-full [&_[data-slot=card]]:h-full [&_[data-slot=card]]:flex [&_[data-slot=card]]:flex-col [&_[data-slot=card-content]]:flex-1 [&_[data-slot=card-content]]:min-h-0 [&_[data-slot=card-content]]:overflow-hidden">
              <WidgetWrapper
                isEditing={isEditing}
                onRemove={() => handleRemoveWidget(widgetOrder[idx])}
              >
                {renderWidget(widgetOrder[idx], data)}
              </WidgetWrapper>
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  )
}
