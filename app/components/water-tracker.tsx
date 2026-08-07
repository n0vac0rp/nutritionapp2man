"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Droplets } from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { useWaterToday } from "../hooks/use-water"
import { useProfile } from "../hooks/use-profile"

export default function WaterTracker() {
  const { user } = useAuth()
  const { amount: waterIntake, addWater, removeWater, isLoading } = useWaterToday()
  const { profile } = useProfile()

  if (!user) return null

  const goal = profile?.waterGoal ?? 2000
  const pct = Math.min(100, Math.round((waterIntake / goal) * 100))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Water Tracker
        </CardTitle>
        <CardDescription>Track your daily water intake</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{waterIntake}ml</span>
          <span className="text-muted-foreground">of {goal}ml goal</span>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-sm text-muted-foreground">{pct}% of daily goal</p>
        <div className="flex flex-wrap gap-2">
          {[250, 500, 750, 1000].map((amount) => (
            <Button key={amount} variant="outline" size="sm" onClick={() => addWater(amount)} disabled={isLoading}>
              +{amount}ml
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => removeWater(250)} disabled={isLoading || waterIntake < 250}>
            -250ml
          </Button>
          <Button variant="outline" size="sm" onClick={() => removeWater(500)} disabled={isLoading || waterIntake < 500}>
            -500ml
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeWater(waterIntake)}
            disabled={isLoading || waterIntake === 0}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
