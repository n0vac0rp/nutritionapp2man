import {
  Home,
  Utensils,
  Dumbbell,
  HeartPulse,
  BarChart3,
  User,
  Shield,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const mainNavItems: NavItem[] = [
  { id: "today", label: "Today", icon: Home },
  { id: "log", label: "Log", icon: Utensils },
  { id: "activities", label: "Activities", icon: Dumbbell },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "profile", label: "Profile", icon: User },
]

export const moreNavItems: NavItem[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "admin", label: "Admin", icon: Shield, adminOnly: true },
]

export const allNavItems: NavItem[] = [...mainNavItems, ...moreNavItems]
