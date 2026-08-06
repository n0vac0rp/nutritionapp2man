export interface BMIResult {
  bmi: number
  category: "Underweight" | "Normal" | "Overweight" | "Obese"
  description: string
  recommendations: string[]
}

export interface WaistToHeightResult {
  ratio: number
  category: "Healthy" | "Increased Risk" | "High Risk"
  description: string
  recommendations: string[]
}

export interface WHRResult {
  ratio: number
  category: "Low Risk" | "High Risk"
  waistCategory: "Low Risk" | "Increased Risk" | "High Risk"
  description: string
  recommendations: string[]
}

export function calculateBMI(weight: number, height: number): BMIResult {
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)

  let category: BMIResult["category"]
  let description: string
  let recommendations: string[]

  if (bmi < 18.5) {
    category = "Underweight"
    description = "You are underweight. Focus on gaining healthy weight through nutritious foods."
    recommendations = [
      "Increase calorie intake with healthy Nigerian foods like Moi Moi and nuts",
      "Add protein-rich foods like fish, chicken, and beans to your meals",
      "Include healthy fats from palm oil, groundnuts, and avocados",
      "Eat frequent small meals throughout the day",
      "Consider adding Akamu (pap) with milk for extra calories",
    ]
  } else if (bmi >= 18.5 && bmi < 25) {
    category = "Normal"
    description = "You have a healthy weight. Maintain your current lifestyle with balanced nutrition."
    recommendations = [
      "Continue eating a balanced diet with variety of Nigerian foods",
      "Maintain regular physical activity",
      "Include plenty of vegetables like Ugwu and waterleaf",
      "Keep portion sizes moderate",
      "Stay hydrated and limit processed foods",
    ]
  } else if (bmi >= 25 && bmi < 30) {
    category = "Overweight"
    description = "You are overweight. Focus on gradual weight loss through diet and exercise."
    recommendations = [
      "Reduce portion sizes, especially of starchy foods like rice and yam",
      "Choose grilled or boiled foods over fried options",
      "Increase vegetable intake with soups like Efo Riro",
      "Limit high-calorie foods like fried plantain and reduce oil usage",
      "Include more fiber-rich foods like beans and vegetables",
    ]
  } else {
    category = "Obese"
    description = "You are obese. Consult a healthcare provider for a comprehensive weight management plan."
    recommendations = [
      "Significantly reduce calorie intake under medical supervision",
      "Focus on lean proteins like grilled fish and chicken",
      "Prioritize vegetables and limit starchy staples",
      "Avoid fried foods and reduce oil consumption",
      "Consider professional nutritional counseling",
    ]
  }

  return {
    bmi: Number(bmi.toFixed(1)),
    category,
    description,
    recommendations,
  }
}

export function calculateWaistToHeightRatio(waistCircumference: number, height: number): WaistToHeightResult {
  const ratio = waistCircumference / height

  let category: WaistToHeightResult["category"]
  let description: string
  let recommendations: string[]

  if (ratio < 0.5) {
    category = "Healthy"
    description = "Your waist-to-height ratio indicates a healthy distribution of body fat."
    recommendations = [
      "Maintain your current healthy lifestyle",
      "Continue regular physical activity",
      "Keep eating a balanced Nigerian diet",
      "Monitor your measurements regularly",
    ]
  } else if (ratio >= 0.5 && ratio < 0.6) {
    category = "Increased Risk"
    description = "Your waist-to-height ratio suggests increased health risks. Consider lifestyle changes."
    recommendations = [
      "Focus on reducing abdominal fat through exercise",
      "Increase fiber intake with vegetables and beans",
      "Reduce refined carbohydrates and sugary foods",
      "Include more physical activity in your daily routine",
      "Consider strength training exercises",
    ]
  } else {
    category = "High Risk"
    description = "Your waist-to-height ratio indicates high health risks. Consult a healthcare provider."
    recommendations = [
      "Seek professional medical advice immediately",
      "Focus on significant lifestyle changes",
      "Prioritize cardiovascular exercise",
      "Drastically reduce processed foods and sugar",
      "Consider working with a nutritionist",
    ]
  }

  return {
    ratio: Number(ratio.toFixed(2)),
    category,
    description,
    recommendations,
  }
}

export function assessWaistCircumference(
  waistCircumference: number,
  gender: "male" | "female" | "other",
): {
  category: "Low Risk" | "Increased Risk" | "High Risk"
  description: string
} {
  if (gender === "male" || gender === "other") {
    if (waistCircumference < 94) {
      return {
        category: "Low Risk",
        description: "Your waist circumference is within the healthy range for males.",
      }
    } else if (waistCircumference >= 94 && waistCircumference < 100) {
      return {
        category: "Increased Risk",
        description: "Your waist circumference indicates increased health risk. Consider lifestyle changes.",
      }
    } else {
      return {
        category: "High Risk",
        description: "Your waist circumference indicates high health risk. Consult a healthcare provider.",
      }
    }
  } else {
    // Female
    if (waistCircumference < 80) {
      return {
        category: "Low Risk",
        description: "Your waist circumference is within the healthy range for females.",
      }
    } else if (waistCircumference >= 80 && waistCircumference < 90) {
      return {
        category: "Increased Risk",
        description: "Your waist circumference indicates increased health risk. Consider lifestyle changes.",
      }
    } else {
      return {
        category: "High Risk",
        description: "Your waist circumference indicates high health risk. Consult a healthcare provider.",
      }
    }
  }
}

export function calculateWHR(
  waistCircumference: number,
  hipCircumference: number,
  gender: "male" | "female" | "other",
): WHRResult {
  const ratio = waistCircumference / hipCircumference
  const waistAssessment = assessWaistCircumference(waistCircumference, gender)

  let category: WHRResult["category"]
  let description: string
  let recommendations: string[]

  // Gender-specific thresholds
  const threshold = gender === "female" ? 0.85 : 0.9

  if (ratio <= threshold) {
    category = "Low Risk"
    description = `Your waist-to-hip ratio is within the healthy range. This indicates a lower risk of cardiovascular disease and metabolic complications.`
    recommendations = [
      "Maintain your current healthy lifestyle",
      "Continue regular physical activity",
      "Keep eating a balanced Nigerian diet with plenty of vegetables",
      "Monitor your measurements regularly",
    ]
  } else {
    category = "High Risk"
    description = `Your waist-to-hip ratio is above the healthy threshold (>${threshold}). This apple-shaped body pattern is associated with higher risks of cardiovascular disease, type 2 diabetes, and metabolic complications.`
    recommendations = [
      "Focus on reducing abdominal fat through cardiovascular exercise",
      "Include strength training to build muscle and improve body composition",
      "Reduce intake of refined carbohydrates and sugary foods",
      "Increase fiber intake with vegetables like Ugwu, waterleaf, and beans",
      "Consider consulting a healthcare provider for personalized advice",
      "Limit fried foods and reduce oil consumption in cooking",
    ]
  }

  return {
    ratio: Number(ratio.toFixed(2)),
    category,
    waistCategory: waistAssessment.category,
    description,
    recommendations,
  }
}

export function calculateEnhancedHealthMetrics(
  weight: number,
  height: number,
  waistCircumference?: number | null,
  hipCircumference?: number | null,
  gender?: "male" | "female" | "other" | null,
): {
  bmi: BMIResult
  waistToHeight?: WaistToHeightResult
  whr?: WHRResult // Added WHR result
  overallRisk: "Low" | "Moderate" | "High" | "Very High"
  combinedRecommendations: string[]
} {
  const bmi = calculateBMI(weight, height)
  const waistToHeight = waistCircumference ? calculateWaistToHeightRatio(waistCircumference, height) : undefined
  const whr =
    waistCircumference && hipCircumference && gender
      ? calculateWHR(waistCircumference, hipCircumference, gender)
      : undefined

  let overallRisk: "Low" | "Moderate" | "High" | "Very High" = "Low"

  if (
    bmi.category === "Normal" &&
    (!waistToHeight || waistToHeight.category === "Healthy") &&
    (!whr || whr.category === "Low Risk")
  ) {
    overallRisk = "Low"
  } else if (
    (bmi.category === "Normal" && waistToHeight?.category === "Increased Risk") ||
    (bmi.category === "Normal" && whr?.category === "High Risk") ||
    (bmi.category === "Overweight" &&
      (!waistToHeight || waistToHeight.category === "Healthy") &&
      (!whr || whr.category === "Low Risk"))
  ) {
    overallRisk = "Moderate"
  } else if (
    (bmi.category === "Overweight" && waistToHeight?.category === "Increased Risk") ||
    (bmi.category === "Overweight" && whr?.category === "High Risk") ||
    (bmi.category === "Obese" &&
      (!waistToHeight || waistToHeight.category === "Healthy") &&
      (!whr || whr.category === "Low Risk")) ||
    (bmi.category === "Normal" && waistToHeight?.category === "High Risk")
  ) {
    overallRisk = "High"
  } else {
    overallRisk = "Very High"
  }

  const combinedRecommendations = [
    ...bmi.recommendations.slice(0, 2),
    ...(waistToHeight?.recommendations.slice(0, 1) || []),
    ...(whr?.recommendations.slice(0, 2) || []),
  ]

  return {
    bmi,
    waistToHeight,
    whr, // Include WHR in return
    overallRisk,
    combinedRecommendations,
  }
}

export function calculatePortionWeight(
  bmi: number,
  fistCircumference: number,
  height: number,
  age: number,
): number {
  const heightInMeters = height / 100
  return Number(
    (-393.0574 + 1.0493 * bmi + 15.4316 * fistCircumference + 153.4906 * heightInMeters + 0.768 * age).toFixed(1),
  )
}

export function getDailyCalorieRecommendation(
  age: number,
  gender: "male" | "female" | "other",
  weight: number,
  height: number,
  activityLevel: "sedentary" | "light" | "moderate" | "active" = "moderate",
): number {
  // Using Mifflin-St Jeor Equation
  let bmr: number

  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  }

  return Math.round(bmr * activityMultipliers[activityLevel])
}

export function analyzeNutritionIntake(
  totalCalories: number,
  recommendedCalories: number,
  bmiCategory: string,
): {
  status: "low" | "normal" | "high"
  message: string
  color: string
} {
  const percentage = (totalCalories / recommendedCalories) * 100

  if (bmiCategory === "Underweight") {
    if (percentage < 90) {
      return {
        status: "low",
        message: "Your calorie intake is too low. Try to eat more nutritious foods.",
        color: "text-red-600",
      }
    } else if (percentage > 110) {
      return {
        status: "normal",
        message: "Good calorie intake for healthy weight gain!",
        color: "text-green-600",
      }
    }
  } else if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
    if (percentage > 110) {
      return {
        status: "high",
        message: "Your calorie intake is too high. Consider reducing portion sizes.",
        color: "text-red-600",
      }
    } else if (percentage < 80) {
      return {
        status: "normal",
        message: "Good calorie control for weight management!",
        color: "text-green-600",
      }
    }
  } else {
    if (percentage < 80 || percentage > 120) {
      return {
        status: percentage < 80 ? "low" : "high",
        message:
          percentage < 80 ? "Consider eating more to meet your energy needs." : "Consider reducing portion sizes.",
        color: "text-orange-600",
      }
    }
  }

  return {
    status: "normal",
    message: "Your calorie intake looks balanced!",
    color: "text-green-600",
  }
}
