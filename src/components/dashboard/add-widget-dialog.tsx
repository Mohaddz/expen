"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { WIDGET_REGISTRY } from "./widget-registry"
import { useState } from "react"

interface AddWidgetDialogProps {
  hiddenWidgets: string[]
  onAdd: (widgetId: string) => void
}

export function AddWidgetDialog({ hiddenWidgets, onAdd }: AddWidgetDialogProps) {
  const [open, setOpen] = useState(false)

  const available = WIDGET_REGISTRY.filter((w) => hiddenWidgets.includes(w.id))

  if (available.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {available.map((widget) => (
            <button
              key={widget.id}
              className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
              onClick={() => {
                onAdd(widget.id)
                setOpen(false)
              }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <widget.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{widget.title}</p>
                <p className="text-xs text-muted-foreground">
                  {widget.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
