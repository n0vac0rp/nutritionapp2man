"use client"

import { allNavItems } from "./nav-items"
import { cn } from "@/lib/utils"

interface AppNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isAdmin: boolean
}

export default function AppNav({ activeTab, onTabChange, isAdmin }: AppNavProps) {
  const items = allNavItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className="hidden lg:block w-56 shrink-0 border-r bg-card">
      <nav className="sticky top-14 z-30 p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
