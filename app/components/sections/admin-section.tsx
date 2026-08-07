"use client"

import AdminDashboard from "../admin-dashboard"
import SectionHeader from "../layout/section-header"

export default function AdminSection() {
  return (
    <div className="space-y-4 xs:space-y-6">
      <SectionHeader title="Admin" description="Manage users and review platform activity" />
      <AdminDashboard />
    </div>
  )
}
