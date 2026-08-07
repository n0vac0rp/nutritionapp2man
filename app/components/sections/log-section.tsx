"use client"

import MealLogger from "../meal-logger"
import SectionHeader from "../layout/section-header"

export default function LogSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Log Your Meal" description="Track your meals using our food database and AI scanner" />
      <MealLogger />
    </div>
  )
}
