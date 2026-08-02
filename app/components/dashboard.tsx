"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/auth-context"
import { useMeals } from "../hooks/use-meals"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut,
  Activity,
  Target,
  TrendingUp,
  Apple,
  Calculator,
  BookOpen,
  PlusCircle,
  Trash2,
  User,
  Utensils,
  Shield,
  SheetIcon as SleepIcon,
  Dumbbell,
  Droplets,
  Hand,
} from "lucide-react"
import { calculateBMI, getDailyCalorieRecommendation, calculatePortionWeight } from "../utils/calculations"
import MealLogger from "./meal-logger"
import BMICalculator from "./bmi-calculator"
import NutritionSummary from "./nutrition-summary"
import Recommendations from "./recommendations"
import PersonalizedWelcome from "./personalized-welcome"
import ProfileSettings from "./profile-settings"
import AdminDashboard from "./admin-dashboard"
import SleepTracker from "./sleep-tracker"
import PhysicalActivities from "./physical-activities"
import WaterTracker from "./water-tracker"
import { api } from "@/lib/api-client"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [waterIntake, setWaterIntake] = useState(0)

  const today = new Date().toISOString().split("T")[0]
  const { meals: todaysMeals, deleteMeal, isLoading: mealsLoading, refetch } = useMeals(today)

  const loadWaterIntake = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.get<{ intake: { amount: number } | null }>("/api/water/today")
      setWaterIntake(data.intake?.amount || 0)
    } catch {}
  }, [user])

  useEffect(() => {
    if (activeTab === "overview") {
      refetch()
      loadWaterIntake()
    }
  }, [activeTab, refetch, loadWaterIntake])

  if (!user) return null

  const bmiResult = calculateBMI(user.weight, user.height)
  const portionWeight = user.fistCircumference
    ? calculatePortionWeight(bmiResult.bmi, user.fistCircumference, user.height, user.age)
    : null
  const dailyCalories = getDailyCalorieRecommendation(user.age, user.gender, user.weight, user.height)

  const totalCaloriesToday = todaysMeals?.reduce((sum, meal) => sum + (meal.totalNutrition?.calories || 0), 0) || 0
  const totalProteinToday = todaysMeals?.reduce((sum, meal) => sum + (meal.totalNutrition?.protein || 0), 0) || 0

  const handleDeleteMeal = async (mealId: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
      const result = await deleteMeal(mealId)
      if (result.success) {
        refetch()
      }
    }
  }

  const isAdmin = user.role === "admin"

  return (
    <div className="min-h-screen-safe bg-background">
      <header className="border-b bg-card sticky top-0 z-50 pt-safe-top">
        <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12 xs:h-14 bg-zinc-900">
            <div className="flex items-center gap-1 xs:gap-2">
              <Utensils className="h-5 w-5 xs:h-6 xs:w-6 text-green-600" />
              <h1 className="text-base xs:text-lg sm:text-xl font-bold text-green-800">GluGuide</h1>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 xs:gap-2">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-1 xs:gap-2 hover:bg-muted/50 rounded-lg p-1 xs:p-1.5"
              >
                <Avatar className="h-5 w-5 xs:h-6 xs:w-6">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" />
                  <AvatarFallback className="bg-green-600 text-white text-xs">
                    {(user.fullName || "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? "Administrator" : `BMI: ${bmiResult.bmi} (${bmiResult.category})`}
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 xs:h-8 xs:w-8"
              >
                <LogOut className="h-3 w-3 xs:h-4 xs:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 py-3 xs:py-4 sm:py-6 pb-safe-bottom">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 xs:space-y-4">
          <TabsList
            className={`grid w-full ${isAdmin ? "grid-cols-3 xs:grid-cols-9 lg:w-fit lg:grid-cols-9" : "grid-cols-3 xs:grid-cols-8 lg:w-fit lg:grid-cols-8"} h-auto p-0.5`}
          >
            <TabsTrigger
              value="overview"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <Activity className="h-3 w-3" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="log-meal"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <PlusCircle className="h-3 w-3" />
              <span>Log Meal</span>
            </TabsTrigger>
            <TabsTrigger
              value="bmi"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <Calculator className="h-3 w-3" />
              <span>BMI</span>
            </TabsTrigger>
            <TabsTrigger
              value="nutrition"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <TrendingUp className="h-3 w-3" />
              <span>Nutrition</span>
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <BookOpen className="h-3 w-3" />
              <span>Tips</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <User className="h-3 w-3" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="sleep"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <SleepIcon className="h-3 w-3" />
              <span>Sleep</span>
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
            >
              <Dumbbell className="h-3 w-3" />
              <span>Activities</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="admin"
                className="flex flex-col xs:flex-row items-center gap-0.5 xs:gap-1 py-1.5 xs:py-1 text-xs"
              >
                <Shield className="h-3 w-3" />
                <span>Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-3 xs:space-y-4">
            <PersonalizedWelcome />

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
              <Card className="xs:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm xs:text-base flex items-center gap-1 xs:gap-2">
                    <Target className="h-3 w-3 xs:h-4 xs:w-4 text-green-600" />
                    Today&apos;s Calories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 xs:space-y-2">
                    <div className="text-lg xs:text-xl font-bold">{totalCaloriesToday.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">of {dailyCalories} recommended</div>
                    <div className="text-xs text-muted-foreground">
                      {totalProteinToday.toFixed(1)}g protein • {todaysMeals.length} meals
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 xs:h-2">
                      <div
                        className="bg-green-600 h-1.5 xs:h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((totalCaloriesToday / dailyCalories) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm xs:text-base flex items-center gap-1 xs:gap-2">
                    <Activity className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600" />
                    BMI Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 xs:space-y-2">
                    <div className="text-lg xs:text-xl font-bold">{bmiResult.bmi}</div>
                    <Badge
                      variant={
                        bmiResult.category === "Normal"
                          ? "default"
                          : bmiResult.category === "Underweight"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {bmiResult.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm xs:text-base flex items-center gap-1 xs:gap-2">
                    <Apple className="h-3 w-3 xs:h-4 xs:w-4 text-orange-600" />
                    Meals Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 xs:space-y-2">
                    <div className="text-lg xs:text-xl font-bold">{todaysMeals.length}</div>
                    <div className="text-xs text-muted-foreground">
                      {todaysMeals.length === 0
                        ? "No meals logged"
                        : todaysMeals.length === 1
                          ? "meal logged"
                          : "meals logged"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {todaysMeals.filter((m) => m.type === "breakfast").length > 0 && "🌅 "}
                      {todaysMeals.filter((m) => m.type === "lunch").length > 0 && "🌞 "}
                      {todaysMeals.filter((m) => m.type === "dinner").length > 0 && "🌙 "}
                      {todaysMeals.filter((m) => m.type === "snack").length > 0 && "🍎 "}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm xs:text-base flex items-center gap-1 xs:gap-2">
                    <Droplets className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600" />
                    Water Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 xs:space-y-2">
                    <div className="text-lg xs:text-xl font-bold text-blue-600">{waterIntake}ml</div>
                    <div className="text-xs text-muted-foreground">of 2000ml goal</div>
                    <div className="w-full bg-secondary rounded-full h-1.5 xs:h-2">
                      <div
                        className="bg-blue-600 h-1.5 xs:h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((waterIntake / 2000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {portionWeight !== null && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm xs:text-base flex items-center gap-1 xs:gap-2">
                      <Hand className="h-3 w-3 xs:h-4 xs:w-4 text-green-600" />
                      Portion Weight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 xs:space-y-2">
                      <div className="text-lg xs:text-xl font-bold text-green-700 dark:text-green-300">
                        {portionWeight}g
                      </div>
                      <div className="text-xs text-muted-foreground">Clenched fist portion</div>
                      <div className="text-xs text-muted-foreground">
                        Fist: {user.fistCircumference}cm
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm xs:text-base">Today&apos;s Meals</CardTitle>
                <CardDescription className="text-xs">Your food intake for today</CardDescription>
              </CardHeader>
              <CardContent>
                {mealsLoading ? (
                  <div className="text-center py-4 xs:py-6">
                    <div className="animate-spin rounded-full h-5 w-5 xs:h-6 xs:w-6 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-muted-foreground mt-2 text-xs">Loading meals...</p>
                  </div>
                ) : todaysMeals.length === 0 ? (
                  <div className="text-center py-4 xs:py-6">
                    <Apple className="h-6 w-6 xs:h-8 xs:w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-xs">No meals logged today</p>
                    <Button
                      onClick={() => setActiveTab("log-meal")}
                      className="mt-3 bg-green-600 hover:bg-green-700 text-xs h-8"
                    >
                      Log Your First Meal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 xs:space-y-3">
                    {todaysMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex flex-col xs:flex-row xs:items-center justify-between p-2 xs:p-3 border rounded-lg gap-2 xs:gap-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1 xs:gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {meal.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{meal.time}</span>
                            {meal.mood && (
                              <Badge variant="outline" className="text-xs">
                                {meal.mood === "great"
                                  ? "😊"
                                  : meal.mood === "good"
                                    ? "🙂"
                                    : meal.mood === "okay"
                                      ? "😐"
                                      : "😔"}{" "}
                                {meal.mood}
                              </Badge>
                            )}
                          </div>
                          <div className="font-medium text-xs xs:text-sm">
                            {meal.foods.map((food) => food.name).join(", ")}
                          </div>
                          {meal.notes && (
                            <div className="text-xs text-muted-foreground italic mt-1">&ldquo;{meal.notes}&rdquo;</div>
                          )}
                        </div>
                        <div className="flex items-center justify-between xs:justify-end gap-2">
                          <div className="text-right">
                            <div className="font-bold text-xs xs:text-sm">
                              {(meal.totalNutrition?.calories ?? 0).toFixed(0)} cal
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(meal.totalNutrition?.protein ?? 0).toFixed(1)}g protein
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm xs:text-base">Quick Health Tips</CardTitle>
                <CardDescription className="text-xs">Based on your BMI and today&apos;s intake</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 xs:space-y-3">
                  {bmiResult.recommendations.slice(0, 3).map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 xs:gap-3 p-2 xs:p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-600 rounded-full mt-1.5 xs:mt-2 flex-shrink-0" />
                      <p className="text-xs xs:text-sm text-white dark:text-gray-100">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log-meal">
            <div className="space-y-4">
              <MealLogger onMealLogged={() => refetch()} />
              <WaterTracker onWaterLogged={() => loadWaterIntake()} />
            </div>
          </TabsContent>

          <TabsContent value="bmi">
            <BMICalculator />
          </TabsContent>

          <TabsContent value="nutrition">
            <NutritionSummary />
          </TabsContent>

          <TabsContent value="recommendations">
            <Recommendations />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="sleep">
            <SleepTracker />
          </TabsContent>

          <TabsContent value="activities">
            <PhysicalActivities />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
