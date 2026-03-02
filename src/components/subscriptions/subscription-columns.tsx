"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format, differenceInDays } from "date-fns"
import {
  CalendarIcon,
  CircleDollarSign,
  FileText,
  MoreHorizontal,
  Pause,
  Play,
  Tag,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  deleteSubscription,
  toggleSubscription,
  updateSubscriptionField,
} from "@/actions/subscriptions"
import type { SubscriptionRow } from "@/actions/subscriptions"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { EditableCell } from "@/components/data-table/editable-cell"
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

const FREQUENCY_OPTIONS: Option[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
]

function SubscriptionRowActions({ subscription }: { subscription: SubscriptionRow }) {
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
        <DropdownMenuItem
          onClick={async () => {
            try {
              await toggleSubscription(subscription.id)
              toast.success(
                subscription.active ? "Subscription paused" : "Subscription resumed"
              )
              router.refresh()
            } catch {
              toast.error("Failed to update")
            }
          }}
        >
          {subscription.active ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={async () => {
            try {
              await deleteSubscription(subscription.id)
              toast.success("Subscription deleted")
              router.refresh()
            } catch {
              toast.error("Failed to delete")
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

async function handleSubscriptionSave(
  id: string,
  field: string,
  value: string | number | boolean | null
) {
  await updateSubscriptionField(id, field, value)
}

export function getSubscriptionColumns(
  categoryOptions: Option[],
  onOptimisticUpdate?: (id: string, field: string, value: string | number | null) => void,
): ColumnDef<SubscriptionRow>[] {
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
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Name" />
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue<string>("name")}
          rowId={row.original.id}
          field="name"
          onSave={handleSubscriptionSave}
          onOptimisticUpdate={onOptimisticUpdate}
          formatDisplay={(v) => (
            <div className="flex items-center gap-2">
              <span
                className={`block max-w-[300px] truncate font-medium ${!row.original.active ? "text-muted-foreground line-through" : ""}`}
              >
                {String(v)}
              </span>
              {!row.original.active && (
                <Badge variant="secondary" className="text-[10px]">
                  Paused
                </Badge>
              )}
            </div>
          )}
        />
      ),
      meta: {
        label: "Name",
        placeholder: "Search names...",
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
        const catId = row.original.categoryId
        return (
          <EditableCell
            value={catId ?? ""}
            rowId={row.original.id}
            field="categoryId"
            type="select"
            options={categoryOptions}
            onSave={handleSubscriptionSave}
            onOptimisticUpdate={onOptimisticUpdate}
            formatDisplay={(v) => {
              const opt = categoryOptions.find((o) => o.value === String(v))
              if (!opt)
                return <span className="text-muted-foreground text-sm">—</span>
              return (
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: opt.color ?? "#6b7280" }}
                  />
                  <span className="text-sm">{opt.label}</span>
                </div>
              )
            }}
          />
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
      id: "frequency",
      accessorKey: "frequency",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Frequency" />
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue<string>("frequency")}
          rowId={row.original.id}
          field="frequency"
          type="select"
          options={FREQUENCY_OPTIONS}
          onSave={handleSubscriptionSave}
          onOptimisticUpdate={onOptimisticUpdate}
          formatDisplay={(v) => (
            <Badge variant="outline" className="text-[10px] capitalize">
              {String(v)}
            </Badge>
          )}
        />
      ),
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) return true
        return filterValue.includes(row.getValue(columnId) as string)
      },
      meta: {
        label: "Frequency",
        variant: "multiSelect",
        options: FREQUENCY_OPTIONS,
        icon: Tag,
      },
      enableColumnFilter: true,
    },
    {
      id: "nextDueDate",
      accessorKey: "nextDueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Next due" />
      ),
      cell: ({ row }) => {
        const nextDueDate = row.getValue<string>("nextDueDate")
        const daysUntilDue = differenceInDays(
          new Date(nextDueDate),
          new Date()
        )
        const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0
        const isActive = row.original.active

        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {format(new Date(nextDueDate), "MMM d, yyyy")}
            </span>
            {isDueSoon && isActive && (
              <Badge
                variant="outline"
                className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20"
              >
                Due soon
              </Badge>
            )}
          </div>
        )
      },
      meta: {
        label: "Next due",
        variant: "date",
        icon: CalendarIcon,
      },
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
        const frequency = row.original.frequency
        const freqLabel =
          frequency === "weekly"
            ? "wk"
            : frequency === "monthly"
              ? "mo"
              : "yr"

        return (
          <EditableCell
            value={amount}
            rowId={row.original.id}
            field="amount"
            type="number"
            onSave={handleSubscriptionSave}
            onOptimisticUpdate={onOptimisticUpdate}
            formatDisplay={(v) => (
              <div className="font-mono font-medium tabular-nums">
                {Number(v).toLocaleString("en-US", {
                  style: "currency",
                  currency: currency || "USD",
                })}
                <span className="text-xs text-muted-foreground">/{freqLabel}</span>
              </div>
            )}
          />
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
      cell: ({ row }) => (
        <SubscriptionRowActions subscription={row.original} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
