import {
  DollarSign,
  TrendingUp,
  PieChart,
  Receipt,
  RefreshCw,
  FileText,
  Upload,
  type LucideIcon,
} from "lucide-react"

export interface WidgetDefinition {
  id: string
  title: string
  description: string
  icon: LucideIcon
  defaultLayout: {
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: "stat-total-spent",
    title: "Total Spent",
    description: "All-time total spending",
    icon: DollarSign,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2, maxH: 3 },
  },
  {
    id: "stat-this-month",
    title: "This Month",
    description: "Current month spending",
    icon: TrendingUp,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2, maxH: 3 },
  },
  {
    id: "stat-subscriptions",
    title: "Subscriptions",
    description: "Monthly subscription cost",
    icon: RefreshCw,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2, maxH: 3 },
  },
  {
    id: "stat-monthly-total",
    title: "Monthly Total",
    description: "Expenses + subscriptions this month",
    icon: Receipt,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2, maxH: 3 },
  },
  {
    id: "spending-chart",
    title: "Spending Chart",
    description: "Monthly, weekly, and yearly spending trends",
    icon: TrendingUp,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 3 },
  },
  {
    id: "category-chart",
    title: "Category Chart",
    description: "Spending breakdown by category",
    icon: PieChart,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 3 },
  },
  {
    id: "recent-expenses",
    title: "Recent Expenses",
    description: "Your latest expenses",
    icon: Receipt,
    defaultLayout: { w: 7, h: 5, minW: 4, minH: 3 },
  },
  {
    id: "upcoming-subscriptions",
    title: "Upcoming Subscriptions",
    description: "Subscriptions due soon",
    icon: RefreshCw,
    defaultLayout: { w: 2, h: 4, minW: 2, minH: 3 },
  },
  {
    id: "recent-invoices",
    title: "Recent Invoices",
    description: "Recently uploaded invoices",
    icon: FileText,
    defaultLayout: { w: 5, h: 4, minW: 3, minH: 3 },
  },
  {
    id: "quick-upload",
    title: "Quick Upload",
    description: "Upload invoice receipts quickly",
    icon: Upload,
    defaultLayout: { w: 2, h: 4, minW: 2, minH: 3 },
  },
]

export const DEFAULT_LAYOUT = [
  // Row 0-1: two stat cards on left, quick upload + upcoming subs on right
  { i: "stat-total-spent", x: 0, y: 0, w: 4, h: 2 },
  { i: "stat-this-month", x: 4, y: 0, w: 4, h: 2 },
  { i: "quick-upload", x: 8, y: 0, w: 2, h: 4 },
  { i: "upcoming-subscriptions", x: 10, y: 0, w: 2, h: 4 },
  // Row 2-3: two more stat cards below
  { i: "stat-subscriptions", x: 0, y: 2, w: 4, h: 2 },
  { i: "stat-monthly-total", x: 4, y: 2, w: 4, h: 2 },
  // Row 4+: recent expenses left, spending chart + category chart right
  { i: "recent-expenses", x: 0, y: 4, w: 6, h: 6 },
  { i: "spending-chart", x: 6, y: 4, w: 6, h: 4 },
  { i: "category-chart", x: 6, y: 8, w: 6, h: 5 },
  // Bottom: recent invoices
  { i: "recent-invoices", x: 0, y: 10, w: 6, h: 4 },
]
