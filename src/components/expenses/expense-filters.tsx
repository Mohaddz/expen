"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { useQueryState } from "nuqs"

interface Category {
  id: string
  name: string
  color: string
}

export function ExpenseFilters({ categories }: { categories: Category[] }) {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [status, setStatus] = useQueryState("status", { defaultValue: "" })
  const [categoryId, setCategoryId] = useQueryState("category", {
    defaultValue: "",
  })

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search expenses..."
          className="pl-9 h-8 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value || null)}
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => setStatus(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[130px] h-8 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={categoryId}
        onValueChange={(v) => setCategoryId(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
