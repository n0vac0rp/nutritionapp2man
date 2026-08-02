"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../contexts/auth-context"
import { api, getToken } from "@/lib/api-client"
import { Users, BarChart3, Eye, Download, Loader2 } from "lucide-react"
import type { User } from "../contexts/auth-context"
import type { Meal } from "../hooks/use-meals"

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [appStats, setAppStats] = useState({ totalUsers: 0, totalMeals: 0, activeUsers: 0 })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userMeals, setUserMeals] = useState<Meal[]>([])
  const [loadingMeals, setLoadingMeals] = useState(false)

  useEffect(() => {
    api.get<{ users: User[]; total: number }>("/api/admin/users?limit=100").then((r) => setUsers(r.users)).catch(() => {})
    api.get<{ totalUsers: number; totalMeals: number; activeUsers: number }>("/api/admin/stats").then(setAppStats).catch(() => {})
  }, [])

  const viewUserData = async (user: User) => {
    setSelectedUser(user)
    setLoadingMeals(true)
    try {
      const data = await api.get<{ user: User; recentMeals: Meal[] }>(`/api/admin/users/${user.id}`)
      setUserMeals(data.recentMeals || [])
    } catch {} finally { setLoadingMeals(false) }
  }

  const exportUserData = async (user: User) => {
    try {
      const res = await fetch("/api/export", { headers: { Authorization: `Bearer ${getToken()}` } })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${user.fullName.replace(/\s+/g, "_")}_nutrition_data.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Total Users</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{appStats.totalUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4" />Total Meals</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{appStats.totalMeals}</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Active (7d)</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{appStats.activeUsers}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => viewUserData(u)}><Eye className="h-3 w-3" /></Button>
                  <Button variant="outline" size="sm" onClick={() => exportUserData(u)}><Download className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedUser.fullName}</CardTitle>
            <CardDescription>{selectedUser.email}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMeals ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading meals...</div>
            ) : userMeals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No meals logged</p>
            ) : (
              <div className="space-y-2">
                {userMeals.slice(0, 10).map((m) => (
                  <div key={m.id} className="p-2 bg-muted/30 rounded text-sm flex justify-between">
                    <span>{m.type} — {m.foods?.map((f) => f.name).join(", ") || "No foods"}</span>
                    <span className="text-muted-foreground">{m.totalNutrition?.calories || 0} cal</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
