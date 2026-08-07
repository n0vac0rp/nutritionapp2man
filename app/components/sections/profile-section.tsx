"use client"

import UserProfileDetails from "../user-profile-details"
import ProfileSettings from "../profile-settings"
import SectionHeader from "../layout/section-header"

export default function ProfileSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Manage your personal information and preferences" />
      <UserProfileDetails />
      <ProfileSettings />
    </div>
  )
}
