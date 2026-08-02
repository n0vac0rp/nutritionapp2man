"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Droplets } from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { api } from "@/lib/api-client"

interface WaterIntake {
  id: string; userId: string; date: string; amount: number
}

export default function WaterTracker({ onWaterLogged }: { onWaterLogged?: () => void }) {
  const { user } = useAuth()
  const [waterIntake, setWaterIntake] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  const loadTodaysWater = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.get<{ intake: WaterIntake | null }>("/api/water/today")
      setWaterIntake(data.intake?.amount || 0)
    } catch {}
  }, [user])

  useEffect(() => {
    loadTodaysWater()
  }, [loadTodaysWater])

  const addWater = async (amount: number) => {
    if (!user || isLoading) return
    setIsLoading(true)
    try {
      await api.post("/api/water", { date: today, amount: waterIntake + amount })
      setWaterIntake((prev) => prev + amount)
      onWaterLogged?.()
    } catch {} finally { setIsLoading(false) }
  }

  const removeWater = async (amount: number) => {
    if (!user || isLoading) return
    const newAmount = Math.max(0, waterIntake - amount)
    setIsLoading(true)
    try {
      await api.post("/api/water", { date: today, amount: newAmount })
      setWaterIntake(newAmount)
      onWaterLogged?.()
    } catch {} finally { setIsLoading(false) }
  }

  const goal = 2000
  const pct = Math.min(100, Math.round((waterIntake / goal) * 100))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-600" />
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
          <Button variant="outline" size="sm" onClick={() => removeWater(waterIntake)} disabled={isLoading || waterIntake === 0}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
