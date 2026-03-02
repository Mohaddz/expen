"use client"

import * as React from "react"
import { toast } from "sonner"

import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const InlineSelect = React.memo(function InlineSelect({
  value,
  rowId,
  field,
  options,
  onSave,
  onOptimisticUpdate,
  formatDisplay,
  className,
}: {
  value: string | number
  rowId: string
  field: string
  options: { label: string; value: string }[]
  onSave: (id: string, field: string, value: string | number | null) => Promise<void>
  onOptimisticUpdate?: (id: string, field: string, value: string | number | null) => void
  formatDisplay?: (value: string | number) => React.ReactNode
  className?: string
}) {
  const [localValue, setLocalValue] = React.useState(String(value ?? ""))

  React.useEffect(() => {
    setLocalValue(String(value ?? ""))
  }, [value])

  const selected = options.find((o) => o.value === localValue)

  return (
    <Select
      value={localValue}
      onValueChange={(v) => {
        if (v === localValue) return
        setLocalValue(v)
        onSave(rowId, field, v).catch(() => {
          setLocalValue(String(value ?? ""))
          toast.error("Failed to update")
        })
        requestAnimationFrame(() => {
          onOptimisticUpdate?.(rowId, field, v)
        })
      }}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-auto min-w-[80px] border-none bg-background px-2 text-sm shadow-none dark:bg-background [&>svg]:opacity-0 [&:hover>svg]:opacity-50",
          className
        )}
      >
        <SelectValue>
          {formatDisplay ? formatDisplay(localValue) : selected?.label ?? localValue}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="data-[state=closed]:animate-none">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

function parseDateValue(value: string | number): Date | undefined {
  if (!value) return undefined
  const str = String(value)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const y = parseInt(match[1], 10)
    const m = parseInt(match[2], 10) - 1
    const d = parseInt(match[3], 10)
    return new Date(y, m, d)
  }
  const date = new Date(str)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const InlineDatePicker = React.memo(function InlineDatePicker({
  value,
  rowId,
  field,
  onSave,
  onOptimisticUpdate,
  formatDisplay,
  className,
}: {
  value: string | number
  rowId: string
  field: string
  onSave: (id: string, field: string, value: string | number | null) => Promise<void>
  onOptimisticUpdate?: (id: string, field: string, value: string | number | null) => void
  formatDisplay?: (value: string | number) => React.ReactNode
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = React.useMemo(() => parseDateValue(value), [value])

  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return
      const isoDate = toISODateString(date)
      if (isoDate === String(value)) {
        setOpen(false)
        return
      }
      setOpen(false)
      // Defer optimistic update until after popover close animation to avoid flicker
      // (parent re-render was causing the popover to briefly reappear)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onOptimisticUpdate?.(rowId, field, isoDate)
          onSave(rowId, field, isoDate).catch(() => {
            onOptimisticUpdate?.(rowId, field, value)
            toast.error("Failed to update")
          })
        })
      })
    },
    [field, onSave, onOptimisticUpdate, rowId, value]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer rounded px-1 py-0.5 -mx-1 hover:bg-muted/50 transition-colors",
            className
          )}
        >
          {formatDisplay ? formatDisplay(value) : value}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          captionLayout="dropdown"
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
})

interface EditableCellProps {
  value: string | number
  rowId: string
  field: string
  type?: "text" | "number" | "date" | "select"
  options?: { label: string; value: string }[]
  onSave: (id: string, field: string, value: string | number | null) => Promise<void>
  onOptimisticUpdate?: (id: string, field: string, value: string | number | null) => void
  formatDisplay?: (value: string | number) => React.ReactNode
  className?: string
}

export function EditableCell({
  value,
  rowId,
  field,
  type = "text",
  options,
  onSave,
  onOptimisticUpdate,
  formatDisplay,
  className,
}: EditableCellProps) {
  const [editing, setEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(String(value ?? ""))
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const save = React.useCallback(async () => {
    const newValue = type === "number" ? parseFloat(editValue) || 0 : editValue
    if (String(newValue) === String(value)) {
      setEditing(false)
      return
    }
    onOptimisticUpdate?.(rowId, field, newValue)
    setEditing(false)
    try {
      await onSave(rowId, field, newValue)
    } catch {
      onOptimisticUpdate?.(rowId, field, value)
      toast.error("Failed to update")
    }
  }, [editValue, field, onSave, onOptimisticUpdate, rowId, type, value])

  const cancel = React.useCallback(() => {
    setEditValue(String(value ?? ""))
    setEditing(false)
  }, [value])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        save()
      } else if (e.key === "Escape") {
        cancel()
      }
    },
    [save, cancel]
  )

  if (type === "select" && options) {
    return (
      <InlineSelect
        value={value}
        rowId={rowId}
        field={field}
        options={options}
        onSave={onSave}
        onOptimisticUpdate={onOptimisticUpdate}
        formatDisplay={formatDisplay}
        className={className}
      />
    )
  }

  if (type === "date") {
    return (
      <InlineDatePicker
        value={value}
        rowId={rowId}
        field={field}
        onSave={onSave}
        onOptimisticUpdate={onOptimisticUpdate}
        formatDisplay={formatDisplay}
        className={className}
      />
    )
  }

  if (!editing) {
    return (
      <div
        className={cn(
          "cursor-pointer rounded px-1 py-0.5 -mx-1 hover:bg-muted/50 transition-colors",
          className
        )}
        onClick={() => {
          setEditValue(String(value ?? ""))
          setEditing(true)
        }}
      >
        {formatDisplay ? formatDisplay(value) : value}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type={type === "date" ? "date" : type === "number" ? "number" : "text"}
        step={type === "number" ? "0.01" : undefined}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={save}
        className="h-7 w-auto min-w-[60px] px-2 text-sm"
      />
    </div>
  )
}
