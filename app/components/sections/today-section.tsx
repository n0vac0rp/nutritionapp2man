"use client"

import { useState } from "react"
import { useAuth } from "../../contexts/auth-context"
import { useMeals, type Meal } from "../../hooks/use-meals"
import { useWaterToday } from "../../hooks/use-water"
import { useProfile } from "../../hooks/use-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Target,
  Activity,
  Apple,
  Droplets,
  Plus,
  Trash2,
  Pencil,
  Hand,
  BookOpen,
  Moon,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { calculateBMI, getDailyCalorieRecommendation, calculatePortionWeight } from "../../utils/calculations"
import { todayKey } from "../../utils/dates"
import PersonalizedWelcome from "../personalized-welcome"
import WaterTracker from "../water-tracker"
import SleepTracker from "../sleep-tracker"
import MealLogger from "../meal-logger"
import ConfirmDialog from "../confirm-dialog"
import SectionHeader from "../layout/section-header"
import { api } from "@/lib/api-client"

// Meal mood is stored as the Prisma enum and returned uppercase.
const MOOD_EMOJI: Record<string, string> = {
  GREAT: "😊",
  GOOD: "🙂",
  OKAY: "😐",
  POOR: "😔",
}

interface TodaySectionProps {
  onNavigate: (section: string) => void
}

export default function TodaySection({ onNavigate }: TodaySectionProps) {
  const { user } = useAuth()
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [showFullSleep, setShowFullSleep] = useState(false)
  const [sleepHours, setSleepHours] = useState(8)
  const [sleepQuality, setSleepQuality] = useState("good")
  const [sleepSaving, setSleepSaving] = useState(false)
  const [sleepMessage, setSleepMessage] = useState<string | null>(null)

  const today = todayKey()
  const { meals: todaysMeals, deleteMeal, isLoading: mealsLoading } = useMeals(today)
  const { amount: waterIntake, addWater } = useWaterToday()
  const { profile } = useProfile()

  if (!user) return null

  const waterGoal = profile?.waterGoal ?? 2000
  const bmiResult = calculateBMI(user.weight, user.height)
  const portionWeight = user.fistCircumference
    ? calculatePortionWeight(bmiResult.bmi, user.fistCircumference, user.height, user.age)
    : null
  const dailyCalories = getDailyCalorieRecommendation(user.age, user.gender, user.weight, user.height)

  const totalCaloriesToday = todaysMeals?.reduce((sum, meal) => sum + (meal.totalNutrition?.calories || 0), 0) || 0
  const totalProteinToday = todaysMeals?.reduce((sum, meal) => sum + (meal.totalNutrition?.protein || 0), 0) || 0

  const saveSleep = async () => {
    if (!user) return
    setSleepSaving(true)
    setSleepMessage(null)
    try {
      await api.post("/api/sleep", { date: today, hoursSlept: sleepHours, sleepQuality })
      setSleepMessage("Sleep entry saved")
      setTimeout(() => setSleepMessage(null), 2000)
    } catch {
      setSleepMessage("Failed to save")
    } finally {
      setSleepSaving(false)
    }
  }

  return (
    <div className="space-y-4 xs:space-y-6">
      <SectionHeader title="Today" description="Your daily nutrition and health at a glance" />
      <PersonalizedWelcome />

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
        <Card className="xs:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 xs:gap-2">
              <Target className="h-3 w-3 xs:h-4 xs:w-4 text-green-600 dark:text-green-400" />
              Today&apos;s Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 xs:space-y-2">
              <div className="text-2xl font-bold">{totalCaloriesToday.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">of {dailyCalories} recommended</div>
              <div className="text-xs text-muted-foreground">
                {totalProteinToday.toFixed(1)}g protein • {todaysMeals.length} meals
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 xs:h-2">
                <div
                  className="bg-brand h-1.5 xs:h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((totalCaloriesToday / dailyCalories) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 xs:gap-2">
              <Activity className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600 dark:text-blue-400" />
              BMI Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 xs:space-y-2">
              <div className="text-2xl font-bold">{bmiResult.bmi}</div>
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
            <CardTitle className="flex items-center gap-1 xs:gap-2">
              <Apple className="h-3 w-3 xs:h-4 xs:w-4 text-orange-600 dark:text-orange-400" />
              Meals Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 xs:space-y-2">
              <div className="text-2xl font-bold">{todaysMeals.length}</div>
              <div className="text-xs text-muted-foreground">
                {todaysMeals.length === 0
                  ? "No meals logged"
                  : todaysMeals.length === 1
                    ? "meal logged"
                    : "meals logged"}
              </div>
              <div className="text-xs text-muted-foreground">
                {todaysMeals.filter((m) => m.type.toLowerCase() === "breakfast").length > 0 && "🌅 "}
                {todaysMeals.filter((m) => m.type.toLowerCase() === "lunch").length > 0 && "🌞 "}
                {todaysMeals.filter((m) => m.type.toLowerCase() === "dinner").length > 0 && "🌙 "}
                {todaysMeals.filter((m) => m.type.toLowerCase() === "snack").length > 0 && "🍎 "}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 xs:gap-2">
              <Droplets className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600 dark:text-blue-400" />
              Water Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 xs:space-y-2">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{waterIntake}ml</div>
              <div className="text-xs text-muted-foreground">of {waterGoal}ml goal</div>
              <div className="w-full bg-muted rounded-full h-1.5 xs:h-2">
                <div
                  className="bg-blue-600 h-1.5 xs:h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((waterIntake / waterGoal) * 100, 100)}%` }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                onClick={() => addWater(250)}
              >
                <Plus className="h-3 w-3 mr-1" />
                +250ml
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {portionWeight !== null && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 xs:gap-2">
              <Hand className="h-3 w-3 xs:h-4 xs:w-4 text-green-600 dark:text-green-400" />
              Portion Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 xs:space-y-2">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{portionWeight}g</div>
              <div className="text-xs text-muted-foreground">Clenched fist portion</div>
              <div className="text-xs text-muted-foreground">Fist: {user.fistCircumference}cm</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4">
        <WaterTracker />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Sleep Quick Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Hours Slept</Label>
                <Select value={String(sleepHours)} onValueChange={(v) => setSleepHours(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 25 }, (_, i) => i * 0.5)
                      .filter((h) => h >= 3 && h <= 15)
                      .map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h}h
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quality</Label>
                <Select value={sleepQuality} onValueChange={setSleepQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveSleep} disabled={sleepSaving} className="w-full h-8 text-sm">
              {sleepSaving ? "Saving..." : "Save Sleep"}
            </Button>
            {sleepMessage && <p className="text-xs text-center text-muted-foreground">{sleepMessage}</p>}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowFullSleep(!showFullSleep)}
            >
              {showFullSleep ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {showFullSleep ? "Hide Full Tracker" : "Open Full Sleep Tracker"}
            </Button>
            {showFullSleep && <SleepTracker />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Meals</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground">Your food intake for today</CardDescription>
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
              <Button onClick={() => onNavigate("log")} className="mt-3 bg-primary hover:bg-primary/90 text-xs h-8">
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
                        {meal.type.charAt(0) + meal.type.slice(1).toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{meal.time}</span>
                      {meal.mood && (
                        <Badge variant="outline" className="text-xs">
                          {MOOD_EMOJI[meal.mood.toUpperCase()] ?? "😔"}{" "}
                          {meal.mood.charAt(0) + meal.mood.slice(1).toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="font-medium text-sm">
                      {meal.foods.map((food) => food.name).join(", ")}
                    </div>
                    {meal.notes && (
                      <div className="text-xs text-muted-foreground italic mt-1">&ldquo;{meal.notes}&rdquo;</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between xs:justify-end gap-2">
                    <div className="text-right">
                      <div className="font-bold text-sm">
                        {(meal.totalNutrition?.calories ?? 0).toFixed(0)} cal
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(meal.totalNutrition?.protein ?? 0).toFixed(1)}g protein
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit meal"
                      onClick={() => setEditingMeal(meal)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-6 w-6 p-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete meal"
                      onClick={() => setDeleteMealId(meal.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 h-6 w-6 p-0"
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
          <CardTitle>Quick Health Tips</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground">Based on your BMI and today&apos;s intake</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 xs:space-y-3">
            {bmiResult.recommendations.slice(0, 2).map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-2 xs:gap-3 p-2 xs:p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-brand rounded-full mt-1.5 xs:mt-2 flex-shrink-0" />
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => onNavigate("health")}>
            <BookOpen className="h-3 w-3 mr-1" />
            See more in Health
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteMealId !== null}
        onOpenChange={(open) => !open && setDeleteMealId(null)}
        title="Delete Meal"
        description="Are you sure you want to delete this meal? This cannot be undone."
        onConfirm={() => {
          if (deleteMealId) deleteMeal(deleteMealId)
        }}
      />

      <Dialog open={editingMeal !== null} onOpenChange={(open) => !open && setEditingMeal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
            <DialogDescription>Adjust the foods or portions, then save your changes.</DialogDescription>
          </DialogHeader>
          <MealLogger editingMeal={editingMeal} onExitEdit={() => setEditingMeal(null)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
