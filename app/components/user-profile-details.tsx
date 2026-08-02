"use client"

import { useState } from "react"
import { useAuth } from "../contexts/auth-context"
import { useMeals } from "../hooks/use-meals"
import { useProfile } from "../hooks/use-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateBMI, getDailyCalorieRecommendation } from "../utils/calculations"
import { User, Calendar, TrendingUp, Clock, BarChart3, PieChart } from "lucide-react"
import type { Meal } from "../hooks/use-meals"

interface WeekData {
  weekNumber: number
  startDate: string
  endDate: string
  days: DayData[]
}

interface DayData {
  date: string
  dayName: string
  meals: Meal[]
  totalCalories: number
  totalProtein: number
  mealCount: number
}

export default function UserProfileDetails() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly")
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)

  // Calculate date range for the selected month
  const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0]
  const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split("T")[0]

  const { meals, isLoading } = useMeals(undefined, startDate, endDate)

  if (!user) return null

  const bmiResult = calculateBMI(user.weight, user.height)
  const dailyCalories = getDailyCalorieRecommendation(user.age, user.gender, user.weight, user.height)

  // Process meals into weekly data
  const processWeeklyData = (): WeekData[] => {
    const weeks: WeekData[] = []
    const year = selectedYear
    const month = selectedMonth

    // Get first day of month and calculate weeks
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const currentWeekStart = new Date(firstDay)
    // Adjust to start from Monday
    const dayOfWeek = currentWeekStart.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentWeekStart.setDate(currentWeekStart.getDate() - daysToSubtract)

    let weekNumber = 1

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const days: DayData[] = []

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(currentWeekStart)
        currentDay.setDate(currentDay.getDate() + i)

        const dateString = currentDay.toISOString().split("T")[0]
        const dayMeals = meals.filter((meal) => meal.date === dateString)

        const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.totalNutrition?.calories ?? 0), 0)
        const totalProtein = dayMeals.reduce((sum, meal) => sum + (meal.totalNutrition?.protein ?? 0), 0)

        days.push({
          date: dateString,
          dayName: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
          meals: dayMeals,
          totalCalories,
          totalProtein,
          mealCount: dayMeals.length,
        })
      }

      weeks.push({
        weekNumber,
        startDate: currentWeekStart.toISOString().split("T")[0],
        endDate: weekEnd.toISOString().split("T")[0],
        days,
      })

      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
      weekNumber++
    }

    return weeks
  }

  const weeklyData = processWeeklyData()
  const selectedWeekData = selectedWeek ? weeklyData.find((w) => w.weekNumber === selectedWeek) : null

  // Calculate monthly totals
  const monthlyTotals = meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + (meal.totalNutrition?.calories ?? 0),
      protein: totals.protein + (meal.totalNutrition?.protein ?? 0),
      carbs: totals.carbs + (meal.totalNutrition?.carbs ?? 0),
      fats: totals.fats + (meal.totalNutrition?.fats ?? 0),
      fiber: totals.fiber + (meal.totalNutrition?.fiber ?? 0),
      iron: totals.iron + (meal.totalNutrition?.iron ?? 0),
      vitaminA: totals.vitaminA + (meal.totalNutrition?.vitaminA ?? 0),
      meals: totals.meals + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, iron: 0, vitaminA: 0, meals: 0 },
  )

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const averageDailyCalories = monthlyTotals.calories / daysInMonth

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      {/* User Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            User Profile Details
          </CardTitle>
          <CardDescription>Complete overview of your nutrition journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/placeholder.svg?height=96&width=96" />
              <AvatarFallback className="bg-green-600 text-white text-xl">
                {(user.fullName || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{user.fullName}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{user.age}</div>
                  <div className="text-sm text-muted-foreground">Years Old</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{user.height}cm</div>
                  <div className="text-sm text-muted-foreground">Height</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{user.weight}kg</div>
                  <div className="text-sm text-muted-foreground">Weight</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold">{bmiResult.bmi}</div>
                  <div className="text-sm text-muted-foreground">BMI</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={bmiResult.category === "Normal" ? "default" : "secondary"}>{bmiResult.category}</Badge>
                <Badge variant="outline">{(user.gender || "").charAt(0).toUpperCase() + (user.gender || "").slice(1)}</Badge>
                <Badge variant="outline">Target: {dailyCalories} cal/day</Badge>
                {profile?.culturalBackground.map((bg) => (
                  <Badge key={bg} variant="outline">
                    {(bg || "").charAt(0).toUpperCase() + (bg || "").slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Monthly Meal Analysis
          </CardTitle>
          <CardDescription>Detailed breakdown of your nutrition by month and week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6 justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Month:</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Year:</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">View:</label>
              <Select value={viewMode} onValueChange={(value: "weekly" | "daily") => setViewMode(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{monthlyTotals.meals}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Total Meals</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {averageDailyCalories.toFixed(0)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Avg Daily Calories</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {(monthlyTotals.protein / daysInMonth).toFixed(1)}g
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Avg Daily Protein</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {((monthlyTotals.meals / daysInMonth) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Logging Consistency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly/Daily View */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading meal data...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as "weekly" | "daily")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            {/* Week Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Weekly Breakdown - {months[selectedMonth]} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {weeklyData.map((week) => {
                    const weekCalories = week.days.reduce((sum, day) => sum + day.totalCalories, 0)
                    const weekMeals = week.days.reduce((sum, day) => sum + day.mealCount, 0)
                    const avgDailyCalories = weekCalories / 7

                    return (
                      <div
                        key={week.weekNumber}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedWeek === week.weekNumber
                            ? "border-green-500 bg-green-50 dark:bg-green-950"
                            : "hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedWeek(selectedWeek === week.weekNumber ? null : week.weekNumber)}
                      >
                        <div className="text-center">
                          <div className="font-semibold mb-2">Week {week.weekNumber}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {new Date(week.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                            {new Date(week.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{weekMeals}</div>
                            <div className="text-xs text-muted-foreground">Total Meals</div>
                            <div className="text-sm font-medium">{avgDailyCalories.toFixed(0)} cal/day</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Week Details */}
            {selectedWeekData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Week {selectedWeekData.weekNumber} Details
                  </CardTitle>
                  <CardDescription>
                    {new Date(selectedWeekData.startDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(selectedWeekData.endDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedWeekData.days.map((day) => (
                      <div key={day.date} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{day.dayName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{day.totalCalories.toFixed(0)} cal</div>
                            <div className="text-sm text-muted-foreground">
                              {day.mealCount} meal{day.mealCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>

                        {day.meals.length > 0 ? (
                          <div className="space-y-2">
                            {day.meals.map((meal) => (
                              <div key={meal.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div>
                                  <Badge variant="outline" className="mr-2">
                                    {meal.type}
                                  </Badge>
                                  <span className="text-sm">{meal.time}</span>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {meal.foods.map((food) => food.name).join(", ")}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    {(meal.totalNutrition?.calories ?? 0).toFixed(0)} cal
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {(meal.totalNutrition?.protein ?? 0).toFixed(1)}g protein
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">No meals logged for this day</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Daily Meal Logs - {months[selectedMonth]} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyData.map((week) => (
                    <div key={week.weekNumber} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-4 text-center">
                        Week {week.weekNumber} (
                        {new Date(week.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                        {new Date(week.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                        {week.days.map((day) => (
                          <div key={day.date} className="border rounded p-3 text-center">
                            <div className="font-medium text-sm">{day.dayName}</div>
                            <div className="text-xs text-muted-foreground mb-2">{new Date(day.date).getDate()}</div>
                            <div className="space-y-1">
                              <div className="text-sm font-bold">{day.totalCalories.toFixed(0)}</div>
                              <div className="text-xs text-muted-foreground">cal</div>
                              <div className="text-xs">
                                {day.mealCount} meal{day.mealCount !== 1 ? "s" : ""}
                              </div>
                            </div>

                            {/* Meal indicators */}
                            <div className="flex justify-center gap-1 mt-2">
                              {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
                                const hasMeal = day.meals.some((meal) => meal.type === mealType)
                                return (
                                  <div
                                    key={mealType}
                                    className={`w-2 h-2 rounded-full ${hasMeal ? "bg-green-500" : "bg-gray-200"}`}
                                    title={mealType}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Nutrition Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Monthly Nutrition Trends
          </CardTitle>
          <CardDescription>
            Your nutrition patterns for {months[selectedMonth]} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Macronutrient Distribution */}
            <div className="space-y-4">
              <h4 className="font-medium">Macronutrient Distribution</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Carbohydrates</span>
                    <span>{(((monthlyTotals.carbs * 4) / monthlyTotals.calories) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${((monthlyTotals.carbs * 4) / monthlyTotals.calories) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Protein</span>
                    <span>{(((monthlyTotals.protein * 4) / monthlyTotals.calories) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${((monthlyTotals.protein * 4) / monthlyTotals.calories) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fats</span>
                    <span>{(((monthlyTotals.fats * 9) / monthlyTotals.calories) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${((monthlyTotals.fats * 9) / monthlyTotals.calories) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Averages */}
            <div className="space-y-4">
              <h4 className="font-medium">Daily Averages</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Calories</span>
                  <span className="font-medium">{(monthlyTotals.calories / daysInMonth).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Protein</span>
                  <span className="font-medium">{(monthlyTotals.protein / daysInMonth).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Fiber</span>
                  <span className="font-medium">{(monthlyTotals.fiber / daysInMonth).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Iron</span>
                  <span className="font-medium">{(monthlyTotals.iron / daysInMonth).toFixed(1)}mg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Vitamin A</span>
                  <span className="font-medium">{(monthlyTotals.vitaminA / daysInMonth).toFixed(0)}μg</span>
                </div>
              </div>
            </div>

            {/* Goals Progress */}
            <div className="space-y-4">
              <h4 className="font-medium">Monthly Goals</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Calorie Target</span>
                    <span>{((averageDailyCalories / dailyCalories) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        averageDailyCalories / dailyCalories > 1.1
                          ? "bg-red-500"
                          : averageDailyCalories / dailyCalories < 0.8
                            ? "bg-orange-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min((averageDailyCalories / dailyCalories) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Logging Consistency</span>
                    <span>{((monthlyTotals.meals / (daysInMonth * 3)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((monthlyTotals.meals / (daysInMonth * 3)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
