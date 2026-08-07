"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../contexts/auth-context"
import { useProfile } from "../hooks/use-profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sun, Award } from "lucide-react"
import { api } from "@/lib/api-client"
import { calculateBMI } from "../utils/calculations"

interface Stats {
  totalMealsLogged: number; averageDailyCalories: number; favoriteFood: string
  longestStreak: number; currentStreak: number; achievements: string[]
}

export default function PersonalizedWelcome() {
  const { user } = useAuth()
  const { profile } = useProfile()

  const { data: stats } = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: () => api.get<{ stats: Stats }>("/api/stats").then((r) => r.stats),
    enabled: !!user,
  })

  if (!user) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = user.fullName?.split(" ")?.[0] ?? ""
  const bmiResult = calculateBMI(user.weight, user.height)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-amber-500" />
          {greeting}, {firstName}!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats?.totalMealsLogged || 0}</p>
            <p className="text-xs text-muted-foreground">Meals Logged</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{bmiResult.bmi}</p>
            <p className="text-xs text-muted-foreground">BMI</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{Math.round(stats?.averageDailyCalories || 0)}</p>
            <p className="text-xs text-muted-foreground">Avg Cal/Day</p>
          </div>
        </div>

        {(stats?.achievements?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Award className="h-4 w-4 text-amber-500" /> Achievements
            </p>
            <div className="flex flex-wrap gap-1">
              {stats?.achievements.map((a) => (
                <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
              ))}
            </div>
          </div>
        )}

        {profile?.healthGoals?.length ? (
          <div>
            <p className="text-sm font-medium mb-1">Health Goals</p>
            <div className="flex flex-wrap gap-1">
              {profile.healthGoals.map((g) => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
