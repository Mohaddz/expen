"use client"

import * as React from "react"
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import { getSubscriptions, deleteSubscriptions, type SubscriptionRow } from "@/actions/subscriptions"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableSortList } from "@/components/data-table/data-table-sort-list"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { getSubscriptionColumns } from "@/components/subscriptions/subscription-columns"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Option } from "@/types/data-table"

const PAGE_SIZE = 20

interface SubscriptionsDataTableProps {
  initialData: SubscriptionRow[]
  categoryOptions: Option[]
}

export function SubscriptionsDataTable({
  initialData,
  categoryOptions,
}: SubscriptionsDataTableProps) {
  const router = useRouter()
  const [data, setData] = React.useState<SubscriptionRow[]>(initialData)
  const [loading, setLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(initialData.length >= PAGE_SIZE)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const mountedRef = React.useRef(false)
  const isFirstRender = React.useRef(true)
  React.useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "nextDueDate", desc: false },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const { data: nextData } = await getSubscriptions({
        limit: PAGE_SIZE,
        offset: data.length,
      })
      if (nextData.length < PAGE_SIZE) setHasMore(false)
      setData((prev) => [...prev, ...nextData])
    } finally {
      setLoading(false)
    }
  }, [data.length, hasMore, loading])

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: "100px", threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setData(initialData)
    setHasMore(initialData.length >= PAGE_SIZE)
  }, [initialData])

  const handleOptimisticUpdate = React.useCallback(
    (id: string, field: string, value: string | number | null) => {
      if (!mountedRef.current) return
      React.startTransition(() => {
        setData((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, [field]: value } : row
          )
        )
      })
    },
    []
  )

  const columns = React.useMemo(
    () => getSubscriptionColumns(categoryOptions, handleOptimisticUpdate),
    [categoryOptions, handleOptimisticUpdate],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      columnPinning: { right: ["actions"] },
    },
    filterFns: {
      arrIncludes: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) return true
        const value = row.getValue(columnId)
        return filterValue.includes(value as string)
      },
    },
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const handleBulkDelete = React.useCallback(async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const ids = selectedRows.map((r) => r.original.id)
    try {
      await deleteSubscriptions(ids)
      setData((prev) => prev.filter((row) => !ids.includes(row.id)))
      table.toggleAllRowsSelected(false)
      toast.success(`Deleted ${ids.length} subscription(s)`)
      router.refresh()
    } catch {
      toast.error("Failed to delete subscriptions")
    }
  }, [table, router])

  return (
    <DataTable
      table={table}
      className="mx-auto max-w-5xl p-4"
      actionBar={
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-sm">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="h-7"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      }
      footer={
        hasMore ? (
          <div
            ref={sentinelRef}
            className="flex h-16 items-center justify-center py-4"
          >
            {loading && (
              <span className="text-muted-foreground text-sm">
                Loading more...
              </span>
            )}
          </div>
        ) : null
      }
    >
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} align="end" />
      </DataTableToolbar>
    </DataTable>
  )
}
