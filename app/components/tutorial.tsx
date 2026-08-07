"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronLeft, User, Utensils, BarChart3, Target, CheckCircle, X, Sparkles } from "lucide-react"

interface TutorialProps {
  onComplete: () => void
  onSkip: () => void
}

const tutorialSteps = [
  {
    id: 1,
    title: "Welcome to GluGuide!",
    description: "Your smart nutrition monitoring system for Nigerian foods",
    icon: <User className="h-16 w-16 text-emerald-500 dark:text-emerald-400" />,
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Smart Nutrition Tracking</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            GluGuide helps you track your nutrition with culturally relevant Nigerian foods and personalized
            recommendations tailored to your health goals.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">80+</div>
            <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Nigerian Foods</div>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Smart</div>
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Portion Guide</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Log Your Meals & Use Portion Guide",
    description: "Track what you eat with our extensive Nigerian food database and portion sizing guide",
    icon: <Utensils className="h-16 w-16 text-blue-500 dark:text-blue-400" />,
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Open the <span className="font-medium">Log</span> section to record your breakfast, lunch, dinner, and
            snacks. Our comprehensive database includes your favorite Nigerian dishes:
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
          >
            Jollof Rice
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          >
            Egusi Soup
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
          >
            Pounded Yam
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          >
            Suya
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
          >
            Plantain
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
          >
            And 80+ more!
          </Badge>
        </div>
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">📏</div>
            <div className="font-semibold text-base text-blue-700 dark:text-blue-300">Portion Sizing Guide</div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
            Use our interactive portion sizing guide to get accurate nutrition data. Find it in the{" "}
            <span className="font-medium">Log</span> section to learn proper serving sizes for Nigerian foods.
          </p>
          <div className="text-sm text-blue-500 dark:text-blue-400 font-medium">
            💡 Pro Tip: Check the portion guide before logging meals for the most accurate tracking
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Monitor Your Progress",
    description: "View detailed nutrition analytics and BMI tracking",
    icon: <BarChart3 className="h-16 w-16 text-purple-500 dark:text-purple-400" />,
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Track your daily nutrition intake, BMI changes, and meal patterns with comprehensive analytics and beautiful
            visualizations.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 border border-emerald-200 dark:border-emerald-700 rounded-xl">
            <div className="font-semibold text-lg mb-3 text-emerald-700 dark:text-emerald-300">Daily Calories</div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: "75%" }}
              />
            </div>
            <div className="text-base text-emerald-600 dark:text-emerald-400 font-medium">1,500 / 2,000 cal</div>
          </div>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 border border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300">Protein Goal</div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-500"
                style={{ width: "60%" }}
              />
            </div>
            <div className="text-base text-blue-600 dark:text-blue-400 font-medium">60 / 100g</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Get Personalized Recommendations",
    description: "Receive culturally relevant nutrition advice",
    icon: <Target className="h-16 w-16 text-orange-500 dark:text-orange-400" />,
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on your cultural background, health goals, and eating patterns, receive personalized food
            recommendations tailored to your needs.
          </p>
        </div>
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-xl">
            <div className="font-semibold text-lg mb-2 text-orange-700 dark:text-orange-300">Cultural Preferences</div>
            <p className="text-base text-orange-600 dark:text-orange-400">
              Yoruba, Igbo, Hausa, and more regional cuisines tailored to your heritage
            </p>
          </div>
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl">
            <div className="font-semibold text-lg mb-2 text-emerald-700 dark:text-emerald-300">Health Goals</div>
            <p className="text-base text-emerald-600 dark:text-emerald-400">
              Weight management, diabetes control, heart health, and wellness optimization
            </p>
          </div>
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
            <div className="font-semibold text-lg mb-2 text-purple-700 dark:text-purple-300">Smart Suggestions</div>
            <p className="text-base text-purple-600 dark:text-purple-400">
              Intelligent meal recommendations based on your preferences and nutritional needs
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "You're All Set!",
    description: "Start your nutrition journey today",
    icon: <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400" />,
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Congratulations! You&apos;re ready to start your personalized nutrition journey with GluGuide. Here&apos;s your
            roadmap to success:
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl sm:flex-row sm:items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              1
            </div>
            <div>
              <div className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">Complete your profile</div>
              <div className="text-base text-emerald-600 dark:text-emerald-400">
                Set your cultural preferences and personalized health goals
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl sm:flex-row sm:items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              2
            </div>
            <div>
              <div className="font-semibold text-base text-blue-700 dark:text-blue-300">Log your first meal</div>
              <div className="text-base text-blue-600 dark:text-blue-400">
                Start tracking with breakfast, lunch, dinner, or your favorite snack
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl sm:flex-row sm:items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              3
            </div>
            <div>
              <div className="font-semibold text-lg text-purple-700 dark:text-purple-300">Explore your dashboard</div>
              <div className="text-base text-purple-600 dark:text-purple-400">
                Use Today, Activities, Health, and Analytics to track meals, movement, and insights
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function Tutorial({ onComplete, onSkip }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = tutorialSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl sm:max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/60 border-0 bg-popover text-popover-foreground">
        <CardHeader className="relative bg-primary text-primary-foreground p-6">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Skip tutorial"
            onClick={onSkip}
            className="absolute right-4 top-4 h-10 w-10 p-0 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">{step.icon}</div>
            <div>
              <CardTitle className="text-2xl font-bold mb-2">{step.title}</CardTitle>
              <CardDescription className="text-sm text-primary-foreground/90">{step.description}</CardDescription>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStep ? "bg-white shadow-lg" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 min-h-[360px]">
          {step.content}

          <div className="flex flex-col gap-3 justify-between items-stretch pt-8 mt-8 border-t sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 text-sm h-10 bg-transparent"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground font-medium text-center">
              {currentStep + 1} of {tutorialSteps.length}
            </div>

            <Button
              onClick={nextStep}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 text-sm h-10 shadow-lg"
            >
              {currentStep === tutorialSteps.length - 1 ? "Done" : "Next"}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
