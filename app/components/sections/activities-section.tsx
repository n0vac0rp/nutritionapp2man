"use client"

import ActivityLogger from "../activity-logger"
import SectionHeader from "../layout/section-header"

export default function ActivitiesSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Activities" description="Log your physical activities and track calories burned" />
      <ActivityLogger />
    </div>
  )
}
