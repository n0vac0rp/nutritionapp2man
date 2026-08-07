"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MoreHorizontal } from "lucide-react"
import { mainNavItems, moreNavItems } from "./nav-items"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isAdmin: boolean
}

export default function MobileNav({ activeTab, onTabChange, isAdmin }: MobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const items = moreNavItems.filter((item) => !item.adminOnly || isAdmin)

  const selectFromMore = (tab: string) => {
    setMoreOpen(false)
    onTabChange(tab)
  }

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background pb-safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-6 h-16">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center justify-center gap-1 text-xs cursor-pointer"
              >
                <Icon
                  className={cn("h-5 w-5", active ? "text-brand" : "text-muted-foreground")}
                />
                <span className={cn(active ? "text-brand font-medium" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-xs cursor-pointer"
          >
            <MoreHorizontal
              className={cn(
                "h-5 w-5",
                activeTab === "analytics" || activeTab === "admin"
                  ? "text-brand"
                  : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                activeTab === "analytics" || activeTab === "admin"
                  ? "text-brand font-medium"
                  : "text-muted-foreground",
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
            <DialogDescription>Explore analytics and tools</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            {items.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => selectFromMore(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
