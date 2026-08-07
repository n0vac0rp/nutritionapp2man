"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Minus,
  Clock,
  CheckCircle,
  AlertCircle,
  Hand,
  Search,
  Camera,
  Pencil,
  CalendarDays,
} from "lucide-react"
import PortionSizingGuide from "./portion-sizing-guide"
import AIFoodScanner from "./ai-food-scanner"
import { nigerianFoods, calculateFistNutrition, getAllCategories, type NigerianFood } from "../data/nigerian-foods"
import { calculateBMI, calculatePortionWeight } from "../utils/calculations"
import { toDateKey, todayKey } from "../utils/dates"
import { useMeals, type Meal } from "../hooks/use-meals"

interface MealLoggerProps {
  onMealLogged?: () => void
  editingMeal?: Meal | null
  onExitEdit?: () => void
}

// `key` identifies the row, not the food: an edited meal can contain the same
// food twice, which would otherwise collide on `food.id`.
interface CartItem {
  key: string
  food: NigerianFood
  fists: number
}

export default function MealLogger({ onMealLogged, editingMeal, onExitEdit }: MealLoggerProps = {}) {
  const { user } = useAuth()
  const { addMeal, updateMeal } = useMeals()
  const [showPortionGuide, setShowPortionGuide] = useState(false)
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast")
  const [mealDate, setMealDate] = useState(todayKey())

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [inputMode, setInputMode] = useState<"scan" | "search">("scan")

  const [foodCart, setFoodCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const cartKeyCounter = useRef(0)
  const nextCartKey = () => `cart-${cartKeyCounter.current++}`

  useEffect(() => {
    if (!editingMeal || !user) return
    setMealType((editingMeal.type.toLowerCase() as "breakfast" | "lunch" | "dinner" | "snack") || "breakfast")
    setMealDate(toDateKey(editingMeal.date))
    const fistWeight = user.fistCircumference
      ? calculatePortionWeight(
          calculateBMI(user.weight, user.height).bmi,
          user.fistCircumference,
          user.height,
          user.age,
        )
      : 200
    setFoodCart(
      editingMeal.foods.map((food) => {
        const dbFood = nigerianFoods.find((f) => f.name === food.name)
        const base: NigerianFood =
          dbFood ?? {
            id: `meal-${food.id}`,
            name: food.name,
            category: "Other",
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fats: food.fats,
            fiber: food.fiber,
            iron: food.iron,
            vitaminA: food.vitaminA,
            description: "Previously logged food",
            servingSize: "serving",
            servingWeight: food.grams,
            portionCalories: { small: food.calories, medium: food.calories, large: food.calories },
          }
        // Exact, unrounded — so opening and saving without edits keeps the
        // originally recorded grams instead of snapping to the nearest ½ fist.
        return { key: nextCartKey(), food: base, fists: food.grams / fistWeight }
      }),
    )
  }, [editingMeal, user])

  if (!user) return null

  const portionWeightPerFist = user.fistCircumference
    ? calculatePortionWeight(
        calculateBMI(user.weight, user.height).bmi,
        user.fistCircumference,
        user.height,
        user.age,
      )
    : 200

  const filteredFoods = nigerianFoods.filter((food) => {
    const matchesSearch =
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || food.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = getAllCategories()

  const addToCart = (food: NigerianFood) => {
    const existingCartItem = foodCart.find((item) => item.food.id === food.id)

    if (existingCartItem) {
      setFoodCart(
        foodCart.map((item) =>
          item.key === existingCartItem.key ? { ...item, fists: item.fists + 0.5 } : item,
        ),
      )
    } else {
      setFoodCart([...foodCart, { key: nextCartKey(), food, fists: 1 }])
    }
    setMessage({ type: "success", text: `${food.name} added` })
    setTimeout(() => setMessage(null), 2000)
  }

  const handleFoodIdentified = (foodName: string) => {
    const matchedFood = nigerianFoods.find((f) => f.name.toLowerCase().includes(foodName.toLowerCase()))
    if (matchedFood) {
      addToCart(matchedFood)
    } else {
      const unknownFood: NigerianFood = {
        id: `scanned-${Date.now()}`,
        name: foodName,
        category: "Other",
        calories: 150,
        protein: 3,
        carbs: 20,
        fats: 1,
        fiber: 2,
        iron: 1,
        vitaminA: 50,
        description: `AI-identified food: ${foodName}`,
        servingSize: "serving",
        servingWeight: 100,
        portionCalories: { small: 100, medium: 150, large: 200 },
      }
      addToCart(unknownFood)
    }
  }

  const updateCartFists = (key: string, fists: number) => {
    setFoodCart(foodCart.map((item) => (item.key === key ? { ...item, fists: Math.max(0.5, fists) } : item)))
  }

  const removeFromCart = (key: string) => {
    setFoodCart(foodCart.filter((item) => item.key !== key))
  }

  const saveMeal = async () => {
    if (foodCart.length === 0) {
      setMessage({ type: "error", text: "Please add at least one food item" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const currentTime = new Date().toTimeString().split(" ")[0].substring(0, 5)
      const payload = {
        type: mealType,
        date: mealDate,
        time: currentTime,
        foods: foodCart.map((item) => {
          const nutrition = calculateFistNutrition(item.food, item.fists, portionWeightPerFist)
          return {
            name: item.food.name,
            grams: nutrition.grams,
            nutrition: {
              calories: nutrition.calories,
              protein: nutrition.protein,
              carbs: nutrition.carbs,
              fats: nutrition.fats,
              fiber: nutrition.fiber,
              iron: nutrition.iron,
              vitaminA: nutrition.vitaminA,
            },
          }
        }),
      }

      const result = editingMeal ? await updateMeal(editingMeal.id, payload) : await addMeal(payload)

      if (result.success) {
        setFoodCart([])
        setMessage({ type: "success", text: editingMeal ? "Meal updated successfully!" : "Meal logged successfully!" })
        if (editingMeal && onExitEdit) onExitEdit()
        if (onMealLogged) onMealLogged()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save meal" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while saving the meal" })
    } finally {
      setIsLoading(false)
    }
  }

  const totalCalories = foodCart.reduce((sum, item) => {
    const nutrition = calculateFistNutrition(item.food, item.fists, portionWeightPerFist)
    return sum + nutrition.calories
  }, 0)
  const totalProtein = foodCart.reduce((sum, item) => {
    const nutrition = calculateFistNutrition(item.food, item.fists, portionWeightPerFist)
    return sum + nutrition.protein
  }, 0)
  const totalCarbs = foodCart.reduce((sum, item) => {
    const nutrition = calculateFistNutrition(item.food, item.fists, portionWeightPerFist)
    return sum + nutrition.carbs
  }, 0)
  const totalFats = foodCart.reduce((sum, item) => {
    const nutrition = calculateFistNutrition(item.food, item.fists, portionWeightPerFist)
    return sum + nutrition.fats
  }, 0)
  const totalGrams = foodCart.reduce((sum, item) => {
    const nutrition = calculateFistNutrition(item.food, item.fists, portionWeightPerFist)
    return sum + nutrition.grams
  }, 0)

  if (showPortionGuide) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowPortionGuide(false)} className="mb-4">
          ← Back to Meal Logger
        </Button>
        <PortionSizingGuide />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingMeal ? (
              <Pencil className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            {editingMeal ? "Edit Meal" : "Log Your Meal"}
          </CardTitle>
          <CardDescription>
            Track your meals using our food database and fist-based portion sizing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-green-600 dark:text-green-400">1.</span> Meal type & date
            </span>
            <span>→</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-green-600 dark:text-green-400">2.</span> Add foods
            </span>
            <span>→</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-green-600 dark:text-green-400">3.</span> Adjust fists & save
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                  <SelectItem value="lunch">☀️ Lunch</SelectItem>
                  <SelectItem value="dinner">🌙 Dinner</SelectItem>
                  <SelectItem value="snack">🍎 Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="meal-date" className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Date
              </Label>
              <Input
                id="meal-date"
                type="date"
                value={mealDate}
                max={todayKey()}
                onChange={(e) => setMealDate(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label>Portion Guide</Label>
              <Button
                variant="outline"
                onClick={() => setShowPortionGuide(true)}
                className="flex items-center gap-2 w-full"
              >
                <Hand className="h-4 w-4" />
                Portion Guide
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-3 sm:p-4 space-y-4 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <Button
                variant={inputMode === "scan" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("scan")}
                className={inputMode === "scan" ? "bg-primary hover:bg-primary/90" : ""}
              >
                <Camera className="h-3 w-3 mr-1" />
                Scan Food
              </Button>
              <Button
                variant={inputMode === "search" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("search")}
                className={inputMode === "search" ? "bg-primary hover:bg-primary/90" : ""}
              >
                <Search className="h-3 w-3 mr-1" />
                Search Foods
              </Button>
            </div>

            {inputMode === "scan" ? (
              <AIFoodScanner onFoodIdentified={handleFoodIdentified} />
            ) : (
              <>
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4" />
                  Nigerian Food Database
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="food-search" className="text-sm">
                      Search Foods
                    </Label>
                    <Input
                      id="food-search"
                      placeholder="Search for Nigerian foods..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm">
                      Category
                    </Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredFoods.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Select Foods (Click to add)</Label>
                    <div className="max-h-32 sm:max-h-40 overflow-y-auto border rounded-md">
                      {filteredFoods.map((food) => (
                        <div
                          key={food.id}
                          className="p-2 sm:p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 flex justify-between items-center"
                          onClick={() => addToCart(food)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{food.name}</div>
                            <div className="text-xs text-muted-foreground">{food.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {food.calories} cal per {food.servingSize} • {food.category}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Add ${food.name} to meal`}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
              }`}
            >
              {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)} on {mealDate}
          </CardTitle>
<CardDescription>
            Each fist = {portionWeightPerFist}g. Tap + or − to adjust portions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {foodCart.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-muted-foreground text-sm">
                No foods added yet. Use the food database or AI scanner above to add foods.
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-2">
                Measure your portions in clenched fists — each fist = {portionWeightPerFist}g for you.
              </p>
            </div>
          ) : (
            <>
              {foodCart.map((item) => {
                const nutrition = calculateFistNutrition(item.food, item.fists, portionWeightPerFist)
                return (
                  <div key={item.key} className="p-3 bg-muted/50 rounded-lg border space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.food.name}</h4>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                          {nutrition.calories.toFixed(0)} cal • {nutrition.grams.toFixed(0)}g
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Remove food from meal"
                        onClick={() => removeFromCart(item.key)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 h-8 px-2"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Decrease portion by half a fist"
                          onClick={() => updateCartFists(item.key, Math.max(0.5, item.fists - 0.5))}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-14 text-center text-sm font-medium">
                          {Number(item.fists.toFixed(1))} fists
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Increase portion by half a fist"
                          onClick={() => updateCartFists(item.key, item.fists + 0.5)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">{nutrition.grams.toFixed(0)}g</div>
                    </div>
                  </div>
                )
              })}

              <div className="border-t pt-3 mt-4">
                <h4 className="font-semibold mb-2 text-sm">Meal Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Calories: <span className="font-medium">{totalCalories.toFixed(0)}</span>
                  </div>
                  <div>
                    Protein: <span className="font-medium">{totalProtein.toFixed(1)}g</span>
                  </div>
                  <div>
                    Carbs: <span className="font-medium">{totalCarbs.toFixed(1)}g</span>
                  </div>
                  <div>
                    Fats: <span className="font-medium">{totalFats.toFixed(1)}g</span>
                  </div>
                  <div>
                    Total Weight: <span className="font-medium">{totalGrams.toFixed(0)}g</span>
                  </div>
                  <div>
                    Fist Portion: <span className="font-medium">{portionWeightPerFist}g/fist</span>
                  </div>
                </div>

                <Button
                  onClick={saveMeal}
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-sm"
                  disabled={foodCart.length === 0 || isLoading}
                >
                  {isLoading
                    ? "Saving..."
                    : `${editingMeal ? "Update" : "Save"} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
