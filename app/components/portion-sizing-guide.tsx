"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hand } from "lucide-react"
import Image from "next/image"
import { useAuth } from "../contexts/auth-context"
import { calculateBMI, calculatePortionWeight } from "../utils/calculations"

interface PortionSize {
  id: string
  foodType: string
  handMethod: string
  imageSrc: string
}

const portionSizes: PortionSize[] = [
  {
    id: "protein-portion",
    foodType: "1 portion of Protein/Meat",
    handMethod: "Matchbox size (palm of hand)",
    imageSrc: "/images/meat-portion.jpg",
  },
  {
    id: "grains-portion",
    foodType: "1 portion of Grains/Rice",
    handMethod: "Cupped palm or spoonful",
    imageSrc: "/images/rice-spoon.jpg",
  },
  {
    id: "bread-portion",
    foodType: "1 portion of Bread",
    handMethod: "1 slice (palm size)",
    imageSrc: "/images/bread-slice.jpg",
  },
  {
    id: "vegetables-portion-1",
    foodType: "1 portion of Vegetables",
    handMethod: "Two cupped palms (leafy greens)",
    imageSrc: "/images/leafy-greens.jpg",
  },
  {
    id: "vegetables-portion-2",
    foodType: "1 portion of Vegetables",
    handMethod: "Whole vegetable (cucumber size)",
    imageSrc: "/images/cucumber.jpg",
  },
  {
    id: "vegetables-portion-3",
    foodType: "1 portion of Vegetables",
    handMethod: "2-3 medium vegetables",
    imageSrc: "/images/eggplants.jpg",
  },
  {
    id: "vegetables-portion-4",
    foodType: "1 portion of Vegetables",
    handMethod: "2 medium carrots",
    imageSrc: "/images/carrots.jpg",
  },
  {
    id: "fruit-portion-1",
    foodType: "1 portion of Fruit",
    handMethod: "Closed fist (apple size)",
    imageSrc: "/images/apple.jpg",
  },
  {
    id: "fruit-portion-2",
    foodType: "1 portion of Fruit",
    handMethod: "Closed fist (orange size)",
    imageSrc: "/images/orange.jpg",
  },
  {
    id: "nuts-portion",
    foodType: "1 portion of Nuts/Seeds",
    handMethod: "Small handful (cupped palm)",
    imageSrc: "/images/peanuts-handful.jpg",
  },
  {
    id: "fats-portion",
    foodType: "1 portion of Fats/Oils",
    handMethod: "1 tablespoon",
    imageSrc: "/images/oil-spoon.jpg",
  },
  {
    id: "water-portion",
    foodType: "1 serving of Water",
    handMethod: "1 sachet (500ml) or 2 cups",
    imageSrc: "/images/water-sachet.jpg",
  },
]

export default function PortionSizingGuide() {
  const { user } = useAuth()

  const portionWeight =
    user?.fistCircumference
      ? calculatePortionWeight(
          calculateBMI(user.weight, user.height).bmi,
          user.fistCircumference,
          user.height,
          user.age,
        )
      : null

  return (
    <div className="space-y-6">
      {portionWeight !== null && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand className="h-5 w-5 text-green-600" />
              Your Personalised Portion Weight
            </CardTitle>
            <CardDescription>
              Based on your BMI, fist circumference, height, and age
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-700 dark:text-green-300">
                {portionWeight}g
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is your estimated clenched fist portion weight. One fist-sized serving of food equals approximately {portionWeight}g.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5 text-blue-600" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-hand h-5 w-5 text-blue-600"
            >
              <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"></path>
              <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"></path>
              <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"></path>
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
            </svg>
            Complete Portion Guide
          </CardTitle>
          <CardDescription>
            Learn to estimate proper portion sizes for all food groups using your hands and visual references
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {portionSizes.map((portion) => (
              <Card key={portion.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg text-center">{portion.foodType}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-square bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                    <Image
                      src={portion.imageSrc || "/placeholder.svg"}
                      alt={`${portion.foodType} hand measurement`}
                      width={200}
                      height={200}
                      className="object-cover rounded-lg w-full h-full"
                    />
                  </div>

                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Hand className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">Hand Method</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{portion.handMethod}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Portion Guide Instructions</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Use these visual references and hand measurements to estimate proper portion sizes for all food groups in
              your daily meals. Remember that portion sizes may vary based on your individual nutritional needs and
              activity level.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
