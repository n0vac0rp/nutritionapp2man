"use client"

import { useAuth } from "../contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateBMI } from "../utils/calculations"
import { Lightbulb, Heart, TrendingUp, Apple, Utensils, AlertTriangle } from "lucide-react"

export default function Recommendations() {
  const { user } = useAuth()

  if (!user) return null

  const bmiResult = calculateBMI(user.weight, user.height)

  const getRecommendationsByBMI = () => {
    switch (bmiResult.category) {
      case "Underweight":
        return {
          priority: "high",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-950",
          borderColor: "border-blue-200 dark:border-blue-800",
          foods: [
            { name: "Moi Moi", benefit: "High protein and calories from beans", category: "Protein" },
            { name: "Groundnuts", benefit: "Healthy fats and protein for weight gain", category: "Snacks" },
            { name: "Akamu with milk", benefit: "Easy to digest, high in calories", category: "Breakfast" },
            { name: "Fried plantain", benefit: "Good source of carbs and healthy calories", category: "Sides" },
            { name: "Palm oil", benefit: "Healthy fats for cooking and extra calories", category: "Cooking" },
          ],
          tips: [
            "Eat frequent small meals (5-6 times per day)",
            "Add healthy fats like palm oil and groundnuts to meals",
            "Include protein-rich Nigerian foods like fish, chicken, and beans",
            "Drink nutritious beverages like Akamu with milk",
            "Consider adding avocado and nuts as snacks",
          ],
        }
      case "Overweight":
      case "Obese":
        return {
          priority: "high",
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950",
          borderColor: "border-red-200 dark:border-red-800",
          foods: [
            {
              name: "Ugwu (Fluted Pumpkin)",
              benefit: "Low calorie, high in nutrients and fiber",
              category: "Vegetables",
            },
            { name: "Grilled fish", benefit: "Lean protein without excess oil", category: "Protein" },
            { name: "Boiled plantain", benefit: "Lower calories than fried version", category: "Sides" },
            { name: "Pepper soup", benefit: "Low calorie, high protein soup option", category: "Soups" },
            { name: "Waterleaf", benefit: "Very low calorie, nutrient-dense vegetable", category: "Vegetables" },
          ],
          tips: [
            "Reduce portion sizes, especially of rice and yam",
            "Choose boiled or grilled foods over fried options",
            "Fill half your plate with vegetables like Ugwu and waterleaf",
            "Limit oil usage in cooking",
            "Drink water before meals to help with portion control",
          ],
        }
      default:
        return {
          priority: "normal",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950",
          borderColor: "border-green-200 dark:border-green-800",
          foods: [
            { name: "Jollof rice", benefit: "Balanced carbs with vegetables", category: "Staples" },
            { name: "Egusi soup", benefit: "Good balance of protein, fats, and vegetables", category: "Soups" },
            { name: "Grilled chicken", benefit: "Lean protein for muscle maintenance", category: "Protein" },
            { name: "Mixed vegetables", benefit: "Essential vitamins and minerals", category: "Vegetables" },
            { name: "Fresh fruits", benefit: "Natural vitamins and fiber", category: "Fruits" },
          ],
          tips: [
            "Maintain your current balanced eating pattern",
            "Continue including variety in your Nigerian meals",
            "Keep portion sizes moderate",
            "Stay active with regular exercise",
            "Monitor your weight regularly",
          ],
        }
    }
  }

  const recommendations = getRecommendationsByBMI()

  const culturalTips = [
    {
      title: "Traditional Meal Timing",
      description: "Follow the Nigerian 3-meal pattern: light breakfast, substantial lunch, and moderate dinner.",
      icon: "🕐",
    },
    {
      title: "Seasonal Eating",
      description: "Take advantage of seasonal fruits like mangoes, oranges, and guavas when available.",
      icon: "🌱",
    },
    {
      title: "Cooking Methods",
      description: "Use traditional methods like steaming (Moi Moi) and boiling more than deep frying.",
      icon: "🍳",
    },
    {
      title: "Local Spices",
      description: "Use Nigerian spices like ginger, garlic, and pepper for flavor without extra calories.",
      icon: "🌶️",
    },
    {
      title: "Community Eating",
      description: "Share meals with family - it helps with portion control and social bonding.",
      icon: "👥",
    },
    {
      title: "Hydration",
      description: "Drink plenty of water, especially in Nigeria's warm climate. Limit sugary drinks.",
      icon: "💧",
    },
  ]

  const weeklyMealPlan = {
    Underweight: [
      {
        day: "Monday",
        breakfast: "Akamu with milk + Akara + Banana",
        lunch: "Jollof rice + Grilled chicken + Fried plantain",
        dinner: "Pounded yam + Egusi soup + Fish",
        snack: "Groundnuts + Orange juice",
      },
      {
        day: "Tuesday",
        breakfast: "Bread + Groundnut butter + Pawpaw",
        lunch: "Rice and beans + Fried plantain + Chicken",
        dinner: "Amala + Ewedu soup + Beef",
        snack: "Moi Moi + Fruit juice",
      },
      {
        day: "Wednesday",
        breakfast: "Boiled yam + Scrambled eggs + Avocado",
        lunch: "Fried rice + Grilled fish + Coleslaw",
        dinner: "Eba + Okra soup + Goat meat",
        snack: "Chin chin + Milk",
      },
    ],
    Normal: [
      {
        day: "Monday",
        breakfast: "Akamu + Akara + Orange",
        lunch: "Brown rice + Grilled fish + Vegetable soup",
        dinner: "Boiled plantain + Efo riro + Chicken",
        snack: "Fruits",
      },
      {
        day: "Tuesday",
        breakfast: "Boiled yam + Eggs + Tomato sauce",
        lunch: "Jollof rice + Moi moi + Garden egg stew",
        dinner: "Amala + Gbegiri soup + Fish",
        snack: "Nuts + Water",
      },
      {
        day: "Wednesday",
        breakfast: "Bread + Avocado + Banana",
        lunch: "Rice + Beans + Fried plantain",
        dinner: "Pounded yam + Vegetable soup + Chicken",
        snack: "Coconut + Orange",
      },
    ],
    Overweight: [
      {
        day: "Monday",
        breakfast: "Boiled plantain + Scrambled eggs",
        lunch: "Small portion rice + Grilled fish + Large vegetable serving",
        dinner: "Pepper soup + Small portion yam",
        snack: "Cucumber + Watermelon",
      },
      {
        day: "Tuesday",
        breakfast: "Akamu (no sugar) + Boiled eggs",
        lunch: "Beans + Small plantain + Lots of vegetables",
        dinner: "Vegetable soup + Small portion eba",
        snack: "Carrots + Orange",
      },
      {
        day: "Wednesday",
        breakfast: "Boiled yam + Tomato sauce",
        lunch: "Grilled chicken + Large salad + Small rice",
        dinner: "Fish pepper soup + Vegetables",
        snack: "Apple + Water",
      },
    ],
  }

  const currentMealPlan = weeklyMealPlan[bmiResult.category as keyof typeof weeklyMealPlan] || weeklyMealPlan["Normal"]

  return (
    <div className="space-y-6">
      {/* Personalized Recommendations */}
      <Card className={`${recommendations.borderColor} ${recommendations.bgColor}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className={`h-5 w-5 ${recommendations.color}`} />
            Personalized Recommendations for {bmiResult.category} Users
          </CardTitle>
          <CardDescription>Based on your BMI of {bmiResult.bmi} and Nigerian dietary patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={recommendations.priority === "high" ? "destructive" : "default"}>
                {recommendations.priority === "high" ? "High Priority" : "Maintain Current"}
              </Badge>
              <span className="text-sm text-muted-foreground">{bmiResult.description}</span>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Recommended Nigerian Foods
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.foods.map((food, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-background border rounded-lg text-foreground"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{food.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {food.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{food.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Key Tips for You
              </h4>
              <div className="space-y-2">
                {recommendations.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Nutrition Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
            Nigerian Cultural Nutrition Tips
          </CardTitle>
          <CardDescription>Embrace healthy Nigerian eating traditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {culturalTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <span className="text-2xl">{tip.icon}</span>
                <div>
                  <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Meal Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600 dark:text-green-400" />
            Sample 3-Day Meal Plan
          </CardTitle>
          <CardDescription>
            Customized for {bmiResult.category.toLowerCase()} individuals with Nigerian foods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMealPlan.map((day, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3">{day.day}</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-orange-600 dark:text-orange-400 mb-1">Breakfast</p>
                    <p className="text-muted-foreground">{day.breakfast}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">Lunch</p>
                    <p className="text-muted-foreground">{day.lunch}</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-600 dark:text-purple-400 mb-1">Dinner</p>
                    <p className="text-muted-foreground">{day.dinner}</p>
                  </div>
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400 mb-1">Snack</p>
                    <p className="text-muted-foreground">{day.snack}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future AI/IoT Features */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Coming Soon: AI & IoT Features
          </CardTitle>
          <CardDescription>Future enhancements to make nutrition monitoring even easier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">AI-Powered Features</h4>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Food recognition through camera (identify Nigerian dishes)</li>
                <li>• AI nutrition coach with personalized advice</li>
                <li>• Smart meal planning based on your preferences</li>
                <li>• Predictive health insights and recommendations</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-purple-800 dark:text-purple-200">IoT Integration</h4>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Smart scale integration for automatic weight tracking</li>
                <li>• Wearable device sync for activity and calorie burn</li>
                <li>• Smart kitchen appliances for portion measurement</li>
                <li>• Real-time health monitoring and alerts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
