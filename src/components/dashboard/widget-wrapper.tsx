"use client"

import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WidgetWrapperProps {
  isEditing: boolean
  onRemove: () => void
  children: React.ReactNode
}

export function WidgetWrapper({ isEditing, onRemove, children }: WidgetWrapperProps) {
  return (
    <div className="relative h-full">
      {isEditing && (
        <>
          <div className="drag-handle absolute top-1.5 left-1.5 z-20 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1.5 right-1.5 z-20 h-6 w-6 rounded-full shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
      <div className={`h-full ${isEditing ? "ring-2 ring-primary/20 rounded-lg" : ""}`}>
        {children}
      </div>
    </div>
  )
}
