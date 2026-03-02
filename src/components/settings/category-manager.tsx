"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  color: string
  icon: string | null
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#64748b",
]

function CategoryDialog({
  category,
  onClose,
}: {
  category?: Category
  onClose: () => void
}) {
  const [name, setName] = useState(category?.name ?? "")
  const [color, setColor] = useState(category?.color ?? COLORS[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      if (category) {
        await updateCategory(category.id, { name, color, icon: "circle" })
        toast.success("Category updated")
      } else {
        await createCategory({ name, color, icon: "circle" })
        toast.success("Category created")
      }
      router.refresh()
      onClose()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Color</Label>
        <div className="mt-2 flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                color === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              type="button"
            />
          ))}
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {category ? "Update" : "Create"} Category
      </Button>
    </div>
  )
}

export function CategoryManager({
  categories,
}: {
  categories: Category[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Categories</h3>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="mr-1 h-3 w-3" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
            </DialogHeader>
            <CategoryDialog onClose={() => setShowNew(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="divide-y divide-border rounded-md border">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 px-3 py-2"
          >
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-sm flex-1">{cat.name}</span>

            <Dialog
              open={editingId === cat.id}
              onOpenChange={(o) => setEditingId(o ? cat.id : null)}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Pencil className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                <CategoryDialog
                  category={cat}
                  onClose={() => setEditingId(null)}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={async () => {
                try {
                  await deleteCategory(cat.id)
                  toast.success("Category deleted")
                  router.refresh()
                } catch {
                  toast.error("Failed to delete")
                }
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground text-center">
            No categories yet.
          </p>
        )}
      </div>
    </div>
  )
}
