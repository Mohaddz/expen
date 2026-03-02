"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import {
  CalendarIcon,
  CircleDollarSign,
  FileText,
  MoreHorizontal,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deleteExpense } from "@/actions/expenses"
import type { ExpenseRow } from "@/actions/expenses"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Option } from "@/types/data-table"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
}

const STATUS_OPTIONS: Option[] = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
]

function ExpenseRowActions({ expense }: { expense: ExpenseRow }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/expenses/${expense.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={async () => {
            try {
              await deleteExpense(expense.id)
              router.refresh()
              toast.success("Expense deleted")
            } catch {
              toast.error("Failed to delete expense")
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function getExpenseColumns(
  categoryOptions: Option[],
): ColumnDef<ExpenseRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "title",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Title" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/expenses/${row.original.id}`}
          className="block max-w-[300px] truncate font-medium hover:underline"
        >
          {row.getValue("title")}
        </Link>
      ),
      meta: {
        label: "Title",
        placeholder: "Search titles...",
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "categoryId",
      accessorKey: "categoryId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Category" />
      ),
      cell: ({ row }) => {
        const name = row.original.categoryName
        const color = row.original.categoryColor
        if (!name)
          return <span className="text-muted-foreground text-sm">—</span>
        return (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: color ?? "#6b7280" }}
            />
            <span className="text-sm">{name}</span>
          </div>
        )
      },
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) return true
        return filterValue.includes(row.getValue(columnId) as string)
      },
      meta: {
        label: "Category",
        variant: "multiSelect",
        options: categoryOptions,
        icon: Tag,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "date",
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.getValue<string>("date")), "MMM d, yyyy")}
        </span>
      ),
      meta: {
        label: "Date",
        variant: "date",
        icon: CalendarIcon,
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status")
        return (
          <Badge
            variant="outline"
            className={`capitalize ${STATUS_STYLES[status] ?? ""}`}
          >
            {status}
          </Badge>
        )
      },
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) return true
        return filterValue.includes(row.getValue(columnId) as string)
      },
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: STATUS_OPTIONS,
        icon: Tag,
      },
      enableColumnFilter: true,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue<number>("amount")
        const currency = row.original.currency
        return (
          <div className="text-right font-mono font-medium tabular-nums">
            {amount.toLocaleString("en-US", {
              style: "currency",
              currency: currency || "USD",
            })}
          </div>
        )
      },
      meta: {
        label: "Amount",
        variant: "number",
        unit: "$",
        icon: CircleDollarSign,
      },
    },
    {
      id: "actions",
      header: () => <div className="sr-only">Actions</div>,
      cell: ({ row }) => <ExpenseRowActions expense={row.original} />,
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
