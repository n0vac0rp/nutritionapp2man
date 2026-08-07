"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/auth-context"
import { useProfile } from "../hooks/use-profile"
import { api, getToken } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, AlertCircle, CheckCircle, Download, Upload, Droplets } from "lucide-react"

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth()
  const { profile, updateProfile: updateUserProfile } = useProfile()
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    age: user?.age?.toString() ?? "",
    gender: user?.gender || "",
    height: user?.height?.toString() ?? "",
    weight: user?.weight?.toString() ?? "",
    waistCircumference: user?.waistCircumference?.toString() ?? "",
    hipCircumference: user?.hipCircumference?.toString() ?? "",
    fistCircumference: user?.fistCircumference?.toString() ?? "",
  })

  const [profileData, setProfileData] = useState({
    culturalBackground: profile?.culturalBackground || [],
    dietaryRestrictions: profile?.dietaryRestrictions || [],
    activityLevel: (profile?.activityLevel || "moderate").toLowerCase(),
    healthGoals: profile?.healthGoals || [],
    notifications: profile?.notifications ?? true,
    dataSharing: profile?.dataSharing ?? false,
    units: (profile?.units || "metric").toLowerCase(),
    waterGoal: profile?.waterGoal ?? 2000,
  })

  /*
   * `profile` is fetched asynchronously, so the state above is initialized from
   * `null` on first render. Without this, the form would show defaults and
   * saving would overwrite the user's stored preferences with them. Applied
   * once so a background refetch can't discard an in-progress edit.
   */
  const profileHydrated = useRef(false)
  useEffect(() => {
    if (!profile || profileHydrated.current) return
    profileHydrated.current = true
    setProfileData({
      culturalBackground: profile.culturalBackground || [],
      dietaryRestrictions: profile.dietaryRestrictions || [],
      activityLevel: (profile.activityLevel || "moderate").toLowerCase(),
      healthGoals: profile.healthGoals || [],
      notifications: profile.notifications ?? true,
      dataSharing: profile.dataSharing ?? false,
      units: (profile.units || "metric").toLowerCase(),
      waterGoal: profile.waterGoal ?? 2000,
    })
  }, [profile])

  if (!user) return null

  const exportMonthlyLogs = async () => {
    if (!user) return

    setIsExporting(true)
    try {
      const res = await fetch("/api/export", { headers: { Authorization: `Bearer ${getToken()}` } })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gluguide-export-${exportMonth}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMessage({ type: "success", text: "Export successful!" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to export data" })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setMessage(null)

    try {
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.age ||
        !formData.gender ||
        !formData.height ||
        !formData.weight
      ) {
        setMessage({ type: "error", text: "Please fill in all required fields" })
        setIsUpdating(false)
        return
      }

      const age = Number.parseInt(formData.age)
      const height = Number.parseFloat(formData.height)
      const weight = Number.parseFloat(formData.weight)

      if (age <= 0 || height <= 0 || weight <= 0) {
        setMessage({ type: "error", text: "Age, height, and weight must be positive numbers" })
        setIsUpdating(false)
        return
      }

      const userResult = await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        age,
        gender: formData.gender as "male" | "female" | "other",
        height,
        weight,
        waistCircumference: formData.waistCircumference ? Number.parseFloat(formData.waistCircumference) : undefined,
        hipCircumference: formData.hipCircumference ? Number.parseFloat(formData.hipCircumference) : undefined,
        fistCircumference: formData.fistCircumference ? Number.parseFloat(formData.fistCircumference) : undefined,
      })

      if (!userResult.success) {
        setMessage({ type: "error", text: userResult.error || "Failed to update profile" })
        setIsUpdating(false)
        return
      }

      const profileResult = await updateUserProfile({
        culturalBackground: profileData.culturalBackground,
        dietaryRestrictions: profileData.dietaryRestrictions,
        activityLevel: profileData.activityLevel,
        healthGoals: profileData.healthGoals,
        notifications: profileData.notifications,
        dataSharing: profileData.dataSharing,
        units: profileData.units,
        waterGoal: Number(profileData.waterGoal) || 2000,
      })

      if (profileResult.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: profileResult.error || "Failed to update preferences" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsUpdating(false)
    }
  }

  const culturalGroups = [
    { id: "yoruba", name: "Yoruba", description: "Western Nigeria cuisine" },
    { id: "igbo", name: "Igbo", description: "Eastern Nigeria cuisine" },
    { id: "hausa", name: "Hausa", description: "Northern Nigeria cuisine" },
    { id: "general-nigerian", name: "General Nigerian", description: "Pan-Nigerian dishes" },
    { id: "middle-belt", name: "Middle Belt", description: "Central Nigeria cuisine" },
    { id: "south-south", name: "South-South", description: "Niger Delta cuisine" },
  ]

  const healthGoals = [
    { id: "weight-loss", name: "Weight Loss" },
    { id: "weight-gain", name: "Weight Gain" },
    { id: "balanced-nutrition", name: "Balanced Nutrition" },
    { id: "muscle-building", name: "Muscle Building" },
    { id: "diabetes-management", name: "Diabetes Management" },
    { id: "heart-health", name: "Heart Health" },
  ]

  const toggleCulturalBackground = (groupId: string) => {
    const updated = profileData.culturalBackground.includes(groupId)
      ? profileData.culturalBackground.filter((p) => p !== groupId)
      : [...profileData.culturalBackground, groupId]
    setProfileData({ ...profileData, culturalBackground: updated })
  }

  const toggleHealthGoal = (goalId: string) => {
    const updated = profileData.healthGoals.includes(goalId)
      ? profileData.healthGoals.filter((g) => g !== goalId)
      : [...profileData.healthGoals, goalId]
    setProfileData({ ...profileData, healthGoals: updated })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Export Monthly Logs</CardTitle>
          <CardDescription>Download your nutrition data for a specific month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="export-month" className="text-sm">
                Select Month
              </Label>
              <Input
                id="export-month"
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="bg-background text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={exportMonthlyLogs}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Export includes meals, nutrition summary, and progress data for the selected month.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup your complete nutrition data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-end">
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/export", { headers: { Authorization: `Bearer ${getToken()}` } })
                    if (!res.ok) return
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = url
                    link.download = `nutrition-backup-${new Date().toISOString().split("T")[0]}.json`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                  } catch {}
                }}
                className="bg-primary hover:bg-primary/90 text-white h-9 px-4 text-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Backup All
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Backup your complete profile or import previously exported data.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your information to get more accurate recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-sm">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="bg-background h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-background h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="age" className="text-sm">
                  Age *
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="bg-background h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height" className="text-sm">
                  Height (cm) *
                </Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  required
                  className="bg-background h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-sm">
                  Weight (kg) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  required
                  className="bg-background h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="waist" className="text-sm">
                  Waist (cm)
                </Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  placeholder="80"
                  value={formData.waistCircumference}
                  onChange={(e) => setFormData({ ...formData, waistCircumference: e.target.value })}
                  className="bg-background h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hip" className="text-sm">
                  Hip (cm)
                </Label>
                <Input
                  id="hip"
                  type="number"
                  step="0.1"
                  placeholder="95"
                  value={formData.hipCircumference}
                  onChange={(e) => setFormData({ ...formData, hipCircumference: e.target.value })}
                  className="bg-background h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fist" className="text-sm">
                  Fist Circumference (cm)
                </Label>
                <Input
                  id="fist"
                  type="number"
                  step="0.1"
                  min="5"
                  max="50"
                  placeholder="25"
                  value={formData.fistCircumference}
                  onChange={(e) => setFormData({ ...formData, fistCircumference: e.target.value })}
                  className="bg-background h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="gender" className="text-sm">
                Gender *
              </Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="bg-background h-9">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="water-goal" className="text-sm flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Daily Water Goal (ml)
              </Label>
              <Input
                id="water-goal"
                type="number"
                min="0"
                step="50"
                value={profileData.waterGoal}
                onChange={(e) => setProfileData({ ...profileData, waterGoal: Number(e.target.value) })}
                className="bg-background h-9 text-sm max-w-xs"
              />
              <p className="text-xs text-muted-foreground">Used by the water tracker on Today</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-lg">Cultural Food Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {culturalGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      profileData.culturalBackground.includes(group.id)
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleCulturalBackground(group.id)}
                  >
                    <h5 className="font-medium text-base">{group.name}</h5>
                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-lg">Health Goals</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {healthGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      profileData.healthGoals.includes(goal.id)
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleHealthGoal(goal.id)}
                  >
                    <h5 className="font-medium text-base">{goal.name}</h5>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="activity" className="text-sm">
                Activity Level
              </Label>
              <Select
                value={profileData.activityLevel}
                onValueChange={(value) =>
                  setProfileData({
                    ...profileData,
                    activityLevel: value as "sedentary" | "light" | "moderate" | "active",
                  })
                }
              >
                <SelectTrigger className="bg-background h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (Little to no exercise)</SelectItem>
                  <SelectItem value="light">Light (Light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (Moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="active">Active (Hard exercise 6-7 days/week)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-lg">Settings</h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="notifications" className="text-base font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">Receive meal reminders and nutrition tips</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={profileData.notifications}
                    onCheckedChange={(checked) => setProfileData({ ...profileData, notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="data-sharing" className="text-base font-medium">
                      Anonymous Data Sharing
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">Help improve Nigerian nutrition research</p>
                  </div>
                  <Switch
                    id="data-sharing"
                    checked={profileData.dataSharing}
                    onCheckedChange={(checked) => setProfileData({ ...profileData, dataSharing: checked })}
                  />
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={isUpdating} className="w-full bg-primary hover:bg-primary/90 h-10 text-sm">
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? "Saving Changes..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
