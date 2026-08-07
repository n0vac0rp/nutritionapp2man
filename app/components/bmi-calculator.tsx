"use client"

import { useState } from "react"
import { useAuth } from "../contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { calculateBMI, calculateEnhancedHealthMetrics, getDailyCalorieRecommendation, calculatePortionWeight } from "../utils/calculations"
import { Calculator, TrendingUp, Target, AlertCircle, Activity, ChevronDown, ChevronUp } from "lucide-react"

export default function BMICalculator({ compact = false }: { compact?: boolean } = {}) {
  const { user, updateProfile } = useAuth()
  const [height, setHeight] = useState(user?.height?.toString() ?? "")
  const [weight, setWeight] = useState(user?.weight?.toString() ?? "")
  const [waistCircumference, setWaistCircumference] = useState(user?.waistCircumference?.toString() ?? "")
  const [hipCircumference, setHipCircumference] = useState(user?.hipCircumference?.toString() ?? "")
  const [fistCircumference, setFistCircumference] = useState(user?.fistCircumference?.toString() ?? "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showReferences, setShowReferences] = useState(false)

  if (!user) return null

  const currentBMI = calculateBMI(user.weight, user.height)
  const currentEnhanced = calculateEnhancedHealthMetrics(
    user.weight,
    user.height,
    user.waistCircumference,
    user.hipCircumference,
    user.gender,
  )
  const newMetrics =
    height && weight
      ? calculateEnhancedHealthMetrics(
          Number.parseFloat(weight),
          Number.parseFloat(height),
          waistCircumference ? Number.parseFloat(waistCircumference) : undefined,
          hipCircumference ? Number.parseFloat(hipCircumference) : undefined,
          user.gender,
        )
      : null
  const dailyCalories = getDailyCalorieRecommendation(user.age, user.gender, user.weight, user.height)

  const currentPortionWeight = user.fistCircumference
    ? calculatePortionWeight(currentBMI.bmi, user.fistCircumference, user.height, user.age)
    : null

  const newPortionWeight =
    height && weight && fistCircumference
      ? calculatePortionWeight(
          calculateBMI(Number.parseFloat(weight), Number.parseFloat(height)).bmi,
          Number.parseFloat(fistCircumference),
          Number.parseFloat(height),
          user.age,
        )
      : null

  const updateUserProfile = async () => {
    if (!height || !weight) return

    setIsUpdating(true)
    try {
      updateProfile({
        height: Number.parseFloat(height),
        weight: Number.parseFloat(weight),
        waistCircumference: waistCircumference ? Number.parseFloat(waistCircumference) : undefined,
        hipCircumference: hipCircumference ? Number.parseFloat(hipCircumference) : undefined,
        fistCircumference: fistCircumference ? Number.parseFloat(fistCircumference) : undefined,
      })
      alert("Profile updated successfully!")
    } catch (error) {
      alert("Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  const getBMIColor = (category: string) => {
    switch (category) {
      case "Underweight":
        return "text-blue-600 dark:text-blue-400"
      case "Normal":
        return "text-green-600 dark:text-green-400"
      case "Overweight":
        return "text-orange-600 dark:text-orange-400"
      case "Obese":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600"
    }
  }

  const getBMIBadgeVariant = (category: string) => {
    switch (category) {
      case "Normal":
        return "default"
      case "Underweight":
        return "secondary"
      default:
        return "destructive"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-600 dark:text-green-400"
      case "Moderate":
        return "text-yellow-600 dark:text-yellow-400"
      case "High":
        return "text-orange-600 dark:text-orange-400"
      case "Very High":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
            Your Current Health Metrics
          </CardTitle>
          <CardDescription>Based on your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{currentBMI.bmi}</div>
              <Badge variant={getBMIBadgeVariant(currentBMI.category)} className="mb-2">
                {currentBMI.category}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Height: {user.height}cm, Weight: {user.weight}kg
              </p>
              {user.waistCircumference && currentEnhanced.waistToHeight && (
                <div className="mt-4">
                  <div className="text-2xl font-bold mb-1">{currentEnhanced.waistToHeight.ratio}</div>
                  <Badge
                    variant={currentEnhanced.waistToHeight.category === "Healthy" ? "default" : "destructive"}
                    className="mb-2"
                  >
                    {currentEnhanced.waistToHeight.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Waist-to-Height Ratio: {user.waistCircumference}cm waist
                  </p>
                </div>
              )}
              {user.waistCircumference && user.hipCircumference && currentEnhanced.whr && (
                <div className="mt-4">
                  <div className="text-2xl font-bold mb-1">{currentEnhanced.whr.ratio}</div>
                  <Badge
                    variant={currentEnhanced.whr.category === "Low Risk" ? "default" : "destructive"}
                    className="mb-2"
                  >
                    {currentEnhanced.whr.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Waist-to-Hip Ratio: {user.waistCircumference}cm / {user.hipCircumference}cm
                  </p>
                  <Badge
                    variant={currentEnhanced.whr.waistCategory === "Low Risk" ? "default" : "destructive"}
                    className="mt-2"
                  >
                    Waist: {currentEnhanced.whr.waistCategory}
                  </Badge>
                </div>
              )}
              {currentPortionWeight !== null && (
                <div className="mt-4 p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="text-2xl font-bold mb-1 text-green-700 dark:text-green-300">
                    {currentPortionWeight}g
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Personalised Portion Weight (Clenched Fist)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fist: {user.fistCircumference}cm
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Overall Health Risk:
                  <Badge className={getRiskColor(currentEnhanced.overallRisk)}>{currentEnhanced.overallRisk}</Badge>
                </h4>
                <p className="text-sm text-muted-foreground mb-3">{currentBMI.description}</p>
                {currentEnhanced.whr && (
                  <p className="text-sm text-muted-foreground mb-3 mt-2">{currentEnhanced.whr.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Key Recommendations:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {currentEnhanced.combinedRecommendations.slice(0, 4).map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-brand rounded-full mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics Calculator */}
      {!compact && (
      <Card>
        <CardHeader>
          <CardTitle>Update Your Measurements</CardTitle>
          <CardDescription>Recalculate your health metrics with new measurements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waist">Waist (cm)</Label>
              <Input
                id="waist"
                type="number"
                placeholder="80"
                value={waistCircumference}
                onChange={(e) => setWaistCircumference(e.target.value)}
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">At narrowest point</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hip">Hip (cm)</Label>
              <Input
                id="hip"
                type="number"
                placeholder="95"
                value={hipCircumference}
                onChange={(e) => setHipCircumference(e.target.value)}
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">At widest point</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fist">Fist Circumference (cm)</Label>
              <Input
                id="fist"
                type="number"
                placeholder="25"
                value={fistCircumference}
                onChange={(e) => setFistCircumference(e.target.value)}
                step="0.1"
                min="5"
                max="50"
              />
              <p className="text-xs text-muted-foreground">Around closed fist</p>
            </div>
          </div>

          {newMetrics &&
            (height !== user.height.toString() ||
              weight !== user.weight.toString() ||
              waistCircumference !== (user.waistCircumference?.toString() || "") ||
              hipCircumference !== (user.hipCircumference?.toString() || "") ||
              fistCircumference !== (user.fistCircumference?.toString() || "")) && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">New Health Calculation:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-2xl font-bold">{newMetrics.bmi.bmi}</div>
                      <Badge variant={getBMIBadgeVariant(newMetrics.bmi.category)}>{newMetrics.bmi.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">BMI Category</p>
                  </div>
                  {newMetrics.waistToHeight && (
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-2xl font-bold">{newMetrics.waistToHeight.ratio}</div>
                        <Badge variant={newMetrics.waistToHeight.category === "Healthy" ? "default" : "destructive"}>
                          {newMetrics.waistToHeight.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Waist-to-Height</p>
                    </div>
                  )}
                  {newMetrics.whr && (
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-2xl font-bold">{newMetrics.whr.ratio}</div>
                        <Badge variant={newMetrics.whr.category === "Low Risk" ? "default" : "destructive"}>
                          {newMetrics.whr.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Waist-to-Hip Ratio</p>
                      <Badge
                        variant={newMetrics.whr.waistCategory === "Low Risk" ? "default" : "destructive"}
                        className="mt-2 text-xs"
                      >
                        Waist: {newMetrics.whr.waistCategory}
                      </Badge>
                    </div>
                  )}
                  {newPortionWeight !== null && (
                    <div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">{newPortionWeight}g</div>
                      <p className="text-sm text-muted-foreground">Portion Weight (Fist)</p>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <Badge className={getRiskColor(newMetrics.overallRisk)}>Overall Risk: {newMetrics.overallRisk}</Badge>
                </div>
              </div>
            )}

          <Button
            onClick={updateUserProfile}
            disabled={
              !height ||
              !weight ||
              isUpdating ||
              (height === user.height.toString() &&
                weight === user.weight.toString() &&
                waistCircumference === (user.waistCircumference?.toString() || "") &&
                hipCircumference === (user.hipCircumference?.toString() || "") &&
                fistCircumference === (user.fistCircumference?.toString() || ""))
            }
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isUpdating ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>
      )}

      {!compact && (
      <>
      {/* Waist-to-Hip Ratio (WHR) Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Waist-to-Hip Ratio (WHR) Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div>
                <div className="font-medium text-blue-600 dark:text-blue-400">Men - Low Risk</div>
                <div className="text-sm text-muted-foreground">WHR ≤ 0.90</div>
              </div>
              <div className="text-sm text-muted-foreground">Healthy range</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-red-600 dark:text-red-400">Men - High Risk</div>
                <div className="text-sm text-muted-foreground">WHR {">"} 0.90</div>
              </div>
              <div className="text-sm text-muted-foreground">Increased health risks</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-pink-50 dark:bg-pink-950">
              <div>
                <div className="font-medium text-pink-600 dark:text-pink-400">Women - Low Risk</div>
                <div className="text-sm text-muted-foreground">WHR ≤ 0.85</div>
              </div>
              <div className="text-sm text-muted-foreground">Healthy range</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-red-600 dark:text-red-400">Women - High Risk</div>
                <div className="text-sm text-muted-foreground">WHR {">"} 0.85</div>
              </div>
              <div className="text-sm text-muted-foreground">Increased health risks</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h5 className="font-medium mb-2">Waist Circumference Thresholds</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="font-medium mb-1">Men:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{"<"} 94 cm: Low risk</li>
                  <li>94-99 cm: Increased risk</li>
                  <li>≥ 100 cm: High risk</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">Women:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{"<"} 80 cm: Low risk</li>
                  <li>80-89 cm: Increased risk</li>
                  <li>≥ 90 cm: High risk</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BMI Categories Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            BMI Categories (WHO Standards)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-blue-600 dark:text-blue-400">Underweight</div>
                <div className="text-sm text-muted-foreground">BMI less than 18.5</div>
              </div>
              <div className="text-sm text-muted-foreground">May need to gain weight</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950">
              <div>
                <div className="font-medium text-green-600 dark:text-green-400">Normal Weight</div>
                <div className="text-sm text-muted-foreground">BMI 18.5 - 24.9</div>
              </div>
              <div className="text-sm text-muted-foreground">Healthy weight range</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-orange-600 dark:text-orange-400">Overweight</div>
                <div className="text-sm text-muted-foreground">BMI 25.0 - 29.9</div>
              </div>
              <div className="text-sm text-muted-foreground">May need to lose weight</div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-red-600 dark:text-red-400">Obese</div>
                <div className="text-sm text-muted-foreground">BMI 30.0 and above</div>
              </div>
              <div className="text-sm text-muted-foreground">Consult healthcare provider</div>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}

      {compact && (
      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center justify-between gap-2 cursor-pointer text-base font-semibold"
            onClick={() => setShowReferences(!showReferences)}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              About these metrics
            </span>
            {showReferences ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {showReferences && (
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Waist-to-Hip Ratio (WHR) Standards</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Men — Low Risk: WHR ≤ 0.90</p>
                <p>Men — High Risk: WHR &gt; 0.90</p>
                <p>Women — Low Risk: WHR ≤ 0.85</p>
                <p>Women — High Risk: WHR &gt; 0.85</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Waist Circumference Thresholds</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Men: &lt; 94cm Low risk • 94-99cm Increased • ≥ 100cm High</p>
                <p>Women: &lt; 80cm Low risk • 80-89cm Increased • ≥ 90cm High</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">BMI Categories (WHO Standards)</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Underweight: &lt; 18.5</p>
                <p>Normal Weight: 18.5 – 24.9</p>
                <p>Overweight: 25.0 – 29.9</p>
                <p>Obese: 30.0 and above</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      )}

      {/* Daily Calorie Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Daily Calorie Recommendation
          </CardTitle>
          <CardDescription>Based on your current profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{dailyCalories}</div>
            <div className="text-muted-foreground mb-4">calories per day</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 border rounded-lg">
                <div className="font-medium">For Weight Loss</div>
                <div className="text-muted-foreground">{dailyCalories - 500} calories</div>
              </div>
              <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                <div className="font-medium">For Maintenance</div>
                <div className="text-muted-foreground">{dailyCalories} calories</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium">For Weight Gain</div>
                <div className="text-muted-foreground">{dailyCalories + 500} calories</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Note */}
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">Important Note</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                BMI and WHR are general indicators and may not account for muscle mass, bone density, and other factors.
                Apple-shaped bodies (more fat around the waist) are associated with higher risks of cardiovascular
                disease and type 2 diabetes. For personalized health advice, consult with a healthcare professional or
                registered dietitian.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
