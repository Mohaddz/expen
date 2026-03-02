"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface AppHeaderProps {
  title: string
  children?: React.ReactNode
}

export function AppHeader({ title, children }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      <h1 className="text-sm font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        {children}
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 text-xs text-muted-foreground md:flex"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            )
          }}
        >
          <Search className="mr-2 h-3 w-3" />
          Search...
          <kbd className="pointer-events-none ml-4 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
    </header>
  )
}
