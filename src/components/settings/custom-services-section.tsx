"use client"

import { useState, useEffect } from "react"
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
import {
  createCustomService,
  updateCustomService,
  deleteCustomService,
  migrateCustomServicesFromLocal,
} from "@/actions/custom-services"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Tv } from "lucide-react"
import { useRouter } from "next/navigation"

interface CustomService {
  id: string
  name: string
}

const LOCAL_STORAGE_KEY = "budget-custom-subscription-names"

function ServiceDialog({
  service,
  onClose,
}: {
  service?: CustomService
  onClose: () => void
}) {
  const [name, setName] = useState(service?.name ?? "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      if (service) {
        await updateCustomService(service.id, { name: name.trim() })
        toast.success("Service updated")
      } else {
        await createCustomService({ name: name.trim() })
        toast.success("Service added")
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
        <Label>Service Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Netflix, Custom VPN"
          className="mt-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit()
          }}
        />
      </div>
      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {service ? "Update" : "Add"} Service
      </Button>
    </div>
  )
}

export function CustomServicesSection({
  services,
}: {
  services: CustomService[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const router = useRouter()

  // One-time migration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const names: string[] = JSON.parse(stored)
        if (Array.isArray(names) && names.length > 0) {
          migrateCustomServicesFromLocal(names).then(() => {
            localStorage.removeItem(LOCAL_STORAGE_KEY)
            router.refresh()
          })
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [router])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Subscription Services</h2>
        <p className="text-sm text-muted-foreground">
          Manage custom subscription services. These appear as options when
          creating new subscriptions.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your Custom Services</h3>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Service</DialogTitle>
              </DialogHeader>
              <ServiceDialog onClose={() => setShowNew(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="divide-y divide-border rounded-md border">
          {services.map((svc) => (
            <div key={svc.id} className="flex items-center gap-3 px-3 py-2">
              <Tv className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">{svc.name}</span>

              <Dialog
                open={editingId === svc.id}
                onOpenChange={(o) => setEditingId(o ? svc.id : null)}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Service</DialogTitle>
                  </DialogHeader>
                  <ServiceDialog
                    service={svc}
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
                    await deleteCustomService(svc.id)
                    toast.success("Service deleted")
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
          {services.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No custom services yet. Add services here to use them when
              creating subscriptions.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
