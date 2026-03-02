"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Receipt,
  RefreshCw,
  Upload,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigate = useCallback(
    (path: string) => {
      setOpen(false)
      router.push(path)
    },
    [router]
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate("/expenses/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </CommandItem>
          <CommandItem onSelect={() => navigate("/subscriptions/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Subscription
          </CommandItem>
          <CommandItem onSelect={() => navigate("/upload")}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Invoice
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate("/expenses")}>
            <Receipt className="mr-2 h-4 w-4" />
            Expenses
          </CommandItem>
          <CommandItem onSelect={() => navigate("/subscriptions")}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Subscriptions
          </CommandItem>
          <CommandItem onSelect={() => navigate("/analytics")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
