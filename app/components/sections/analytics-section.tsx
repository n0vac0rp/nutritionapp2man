"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NutritionSummary from "../nutrition-summary"
import MonthlyAnalysis from "../monthly-analysis"
import SectionHeader from "../layout/section-header"

export default function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics" description="Explore your nutrition trends and monthly analysis" />
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="trends">Daily Trends</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="trends">
          <NutritionSummary />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  )
}
