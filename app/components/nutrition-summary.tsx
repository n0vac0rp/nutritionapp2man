"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/auth-context"
import { useMeals } from "../hooks/use-meals"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateBMI, getDailyCalorieRecommendation, analyzeNutritionIntake } from "../utils/calculations"
import { toDateKey, todayKey } from "../utils/dates"
import { TrendingUp, Calendar, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"

interface DayNutrition {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  totalFiber: number
  totalIron: number
  totalVitaminA: number
  mealCount: number
}

export default function NutritionSummary() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState("7") // days
  const [nutritionData, setNutritionData] = useState<DayNutrition[]>([])
  const [bmiResult, setBmiResult] = useState<any | null>(null)
  const [dailyCalories, setDailyCalories] = useState<number | null>(null)

  // Calculate date range
  const endDate = todayKey()
  const startDate = toDateKey(
    new Date(Date.now() - (Number.parseInt(selectedPeriod) - 1) * 24 * 60 * 60 * 1000),
  )

  const { meals, isLoading } = useMeals(undefined, startDate, endDate)

  useEffect(() => {
    if (user) {
      setBmiResult(calculateBMI(user.weight, user.height))
      setDailyCalories(getDailyCalorieRecommendation(user.age, user.gender, user.weight, user.height))
    }
  }, [user])

  const processNutritionData = useCallback(() => {
    const days = Number.parseInt(selectedPeriod)
    const data: DayNutrition[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = toDateKey(date)

      const dayMeals = meals.filter((meal) => toDateKey(meal.date) === dateString)

      const dayTotals = dayMeals.reduce(
        (totals, meal) => ({
          calories: totals.calories + (meal.totalNutrition?.calories ?? 0),
          protein: totals.protein + (meal.totalNutrition?.protein ?? 0),
          carbs: totals.carbs + (meal.totalNutrition?.carbs ?? 0),
          fats: totals.fats + (meal.totalNutrition?.fats ?? 0),
          fiber: totals.fiber + (meal.totalNutrition?.fiber ?? 0),
          iron: totals.iron + (meal.totalNutrition?.iron ?? 0),
          vitaminA: totals.vitaminA + (meal.totalNutrition?.vitaminA ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, iron: 0, vitaminA: 0 },
      )

      data.push({
        date: dateString,
        totalCalories: dayTotals.calories,
        totalProtein: dayTotals.protein,
        totalCarbs: dayTotals.carbs,
        totalFats: dayTotals.fats,
        totalFiber: dayTotals.fiber,
        totalIron: dayTotals.iron,
        totalVitaminA: dayTotals.vitaminA,
        mealCount: dayMeals.length,
      })
    }

    setNutritionData(data.reverse()) // Show oldest to newest
  }, [meals, selectedPeriod])

  useEffect(() => {
    if (meals.length > 0) {
      processNutritionData()
    }
  }, [meals, selectedPeriod, processNutritionData])

  const averages =
    nutritionData.length > 0
      ? {
          calories: nutritionData.reduce((sum, day) => sum + day.totalCalories, 0) / nutritionData.length,
          protein: nutritionData.reduce((sum, day) => sum + day.totalProtein, 0) / nutritionData.length,
          carbs: nutritionData.reduce((sum, day) => sum + day.totalCarbs, 0) / nutritionData.length,
          fats: nutritionData.reduce((sum, day) => sum + day.totalFats, 0) / nutritionData.length,
          fiber: nutritionData.reduce((sum, day) => sum + day.totalFiber, 0) / nutritionData.length,
          iron: nutritionData.reduce((sum, day) => sum + day.totalIron, 0) / nutritionData.length,
          vitaminA: nutritionData.reduce((sum, day) => sum + day.totalVitaminA, 0) / nutritionData.length,
          meals: nutritionData.reduce((sum, day) => sum + day.mealCount, 0) / nutritionData.length,
        }
      : null

  const calorieAnalysis =
    averages && bmiResult && dailyCalories
      ? analyzeNutritionIntake(averages.calories, dailyCalories, bmiResult.category)
      : null

  // Recommended daily values
  const recommendations = {
    protein: user?.gender === "male" ? 56 : 46, // grams
    fiber: 25, // grams
    iron: user?.gender === "male" ? 8 : 18, // mg
    vitaminA: user?.gender === "male" ? 900 : 700, // μg
  }

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage < 70) return "bg-red-500"
    if (percentage < 90) return "bg-orange-500"
    return "bg-green-500"
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            Nutrition Summary
          </CardTitle>
          <CardDescription>Track your nutrition intake over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Time Period:</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading nutrition data...</p>
          </CardContent>
        </Card>
      ) : averages ? (
        <>
          {/* Average Daily Intake */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Average Daily Intake
              </CardTitle>
              <CardDescription>Your average nutrition over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold mb-1">{averages.calories.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground mb-2">Calories</div>
                  <div className="text-xs text-muted-foreground">Target: {dailyCalories}</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(averages.calories, dailyCalories!)}`}
                      style={{ width: `${Math.min((averages.calories / dailyCalories!) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold mb-1">{averages.protein.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground mb-2">Protein (g)</div>
                  <div className="text-xs text-muted-foreground">Target: {recommendations.protein}g</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(averages.protein, recommendations.protein)}`}
                      style={{ width: `${Math.min((averages.protein / recommendations.protein) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold mb-1">{averages.fiber.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground mb-2">Fiber (g)</div>
                  <div className="text-xs text-muted-foreground">Target: {recommendations.fiber}g</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(averages.fiber, recommendations.fiber)}`}
                      style={{ width: `${Math.min((averages.fiber / recommendations.fiber) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold mb-1">{averages.iron.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground mb-2">Iron (mg)</div>
                  <div className="text-xs text-muted-foreground">Target: {recommendations.iron}mg</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(averages.iron, recommendations.iron)}`}
                      style={{ width: `${Math.min((averages.iron / recommendations.iron) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {calorieAnalysis && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    {calorieAnalysis.status === "normal" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    )}
                    <h4 className="font-medium">Calorie Intake Analysis</h4>
                  </div>
                  <p className={`text-sm ${calorieAnalysis.color}`}>{calorieAnalysis.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Macronutrient Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Macronutrient Distribution</CardTitle>
              <CardDescription>Average breakdown of your macronutrients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Carbohydrates</span>
                  <span className="text-sm">
                    {averages.carbs.toFixed(1)}g ({(((averages.carbs * 4) / averages.calories) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${((averages.carbs * 4) / averages.calories) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm">
                    {averages.protein.toFixed(1)}g ({(((averages.protein * 4) / averages.calories) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${((averages.protein * 4) / averages.calories) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fats</span>
                  <span className="text-sm">
                    {averages.fats.toFixed(1)}g ({(((averages.fats * 9) / averages.calories) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full"
                    style={{ width: `${((averages.fats * 9) / averages.calories) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Recommended Distribution</h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <div>Carbohydrates: 45-65% of total calories</div>
                  <div>Protein: 10-35% of total calories</div>
                  <div>Fats: 20-35% of total calories</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Daily Breakdown
              </CardTitle>
              <CardDescription>Your nutrition intake for each day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nutritionData.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">{day.mealCount} meals logged</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{day.totalCalories.toFixed(0)} cal</div>
                      <div className="text-sm text-muted-foreground">{day.totalProtein.toFixed(1)}g protein</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No nutrition data available</h3>
            <p className="text-muted-foreground mb-4">Start logging your meals to see your nutrition summary</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
