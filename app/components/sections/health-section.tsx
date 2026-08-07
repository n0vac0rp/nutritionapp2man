"use client"

import BMICalculator from "../bmi-calculator"
import Recommendations from "../recommendations"
import SectionHeader from "../layout/section-header"

export default function HealthSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Health Metrics" description="Track your BMI, waist-to-hip ratio, and calorie targets" />
      <BMICalculator compact />
      <Recommendations />
    </div>
  )
}
