"use client"

import { useAuth } from "../contexts/auth-context"
import { useProfile } from "../hooks/use-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { calculateBMI, getDailyCalorieRecommendation } from "../utils/calculations"
import { User } from "lucide-react"

export default function UserProfileDetails() {
  const { user } = useAuth()
  const { profile } = useProfile()

  if (!user) return null

  const bmiResult = calculateBMI(user.weight, user.height)
  const dailyCalories = getDailyCalorieRecommendation(user.age, user.gender, user.weight, user.height)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
          User Profile Details
        </CardTitle>
        <CardDescription>Complete overview of your nutrition journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src="/placeholder.svg?height=96&width=96" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
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
                <div className="text-2xl font-bold">{user.age}</div>
                <div className="text-xs font-medium text-muted-foreground">Years Old</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{user.height}cm</div>
                <div className="text-xs font-medium text-muted-foreground">Height</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{user.weight}kg</div>
                <div className="text-xs font-medium text-muted-foreground">Weight</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{bmiResult.bmi}</div>
                <div className="text-xs font-medium text-muted-foreground">BMI</div>
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
  )
}
