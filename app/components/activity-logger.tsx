"use client"

import { useState } from "react"
import { useAuth } from "../contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { activityTypes, getCaloriesPerMinute, type ActivityIntensity } from "../data/activities"
import { useActivities } from "../hooks/use-activities"
import { toDateKey, todayKey } from "../utils/dates"
import ConfirmDialog from "./confirm-dialog"
import { CheckCircle, AlertCircle, Flame, Dumbbell, Plus, Minus, CalendarDays, Trash2 } from "lucide-react"

export default function ActivityLogger() {
  const today = todayKey()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return toDateKey(date)
  }).reverse()

  const { user } = useAuth()
  const { entries, isLoading, logActivity, deleteActivity } = useActivities(last7Days[0], today)
  const [selectedActivity, setSelectedActivity] = useState(activityTypes[0].name)
  const [intensity, setIntensity] = useState<ActivityIntensity>("moderate")
  const [durationMin, setDurationMin] = useState(30)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)

  if (!user) return null

  const todayEntries = entries.filter((entry) => toDateKey(entry.date) === today)
  const todayBurn = todayEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0)

  const caloriesPerMinute = getCaloriesPerMinute(selectedActivity, intensity)
  const estimatedCalories = Math.round(durationMin * caloriesPerMinute)

  const saveActivity = async () => {
    if (durationMin <= 0) {
      setMessage({ type: "error", text: "Duration must be greater than 0 minutes" })
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const result = await logActivity({
        date: today,
        activityType: selectedActivity,
        durationMin,
        intensity,
      })
      if (result.success) {
        setMessage({ type: "success", text: `Logged ${durationMin} min of ${selectedActivity}!` })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to log activity" })
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while saving" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-green-600 dark:text-green-400" />
            Log Physical Activity
          </CardTitle>
          <CardDescription>
            Select an activity, set your effort level, and see the calories you burn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>1. Choose Activity</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activityTypes.map((activity) => {
                const isSelected = selectedActivity === activity.name
                return (
                  <button
                    key={activity.name}
                    type="button"
                    onClick={() => setSelectedActivity(activity.name)}
                    className={`text-left rounded-lg border-2 overflow-hidden transition-colors ${
                      isSelected
                        ? "border-brand ring-2 ring-brand/30"
                        : "border-border hover:border-brand/60"
                    }`}
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={activity.image || "/placeholder.svg"}
                        alt={activity.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2 bg-background">
                      <div className="font-medium text-sm">{activity.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{activity.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>2. Intensity</Label>
              <Select value={intensity} onValueChange={(value) => setIntensity(value as ActivityIntensity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light — easy pace</SelectItem>
                  <SelectItem value="moderate">Moderate — steady effort</SelectItem>
                  <SelectItem value="vigorous">Vigorous — hard work</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedActivity}: {caloriesPerMinute} cal/min at this intensity
              </p>
            </div>

            <div className="space-y-1">
              <Label>3. Duration</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Decrease duration by 5 minutes"
                  onClick={() => setDurationMin(Math.max(5, durationMin - 5))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center border rounded-lg py-2">
                  <span className="text-lg font-bold">{durationMin}</span>
                  <span className="text-sm text-muted-foreground ml-1">min</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Increase duration by 5 minutes"
                  onClick={() => setDurationMin(durationMin + 5)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="font-medium">Estimated Calories Burned</span>
              </div>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{estimatedCalories} cal</span>
            </div>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
              }`}
            >
              {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <Button
            onClick={saveActivity}
            disabled={isSaving || durationMin <= 0}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSaving ? "Logging..." : "Log Activity"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Today&apos;s Activity
          </CardTitle>
          <CardDescription className="text-sm">
            {todayEntries.length === 0
              ? "Log your first activity to start tracking your burn"
              : `${todayBurn} calories burned across ${todayEntries.length} log${todayEntries.length > 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : todayEntries.length === 0 ? (
            <div className="text-center py-6">
              <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No activities logged today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{entry.activityType}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.durationMin} min • {entry.intensity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
                      {entry.caloriesBurned} cal
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete activity"
                      onClick={() => setDeleteEntryId(entry.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 mt-2">
                <span className="font-medium text-sm">Total Burn Today</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{todayBurn} cal</span>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4" />
              Last 7 Days
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {last7Days.map((date) => {
                const dayEntries = entries.filter((entry) => toDateKey(entry.date) === date)
                const dayBurn = dayEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0)
                return (
                  <div key={date} className="text-center p-2 border rounded-lg">
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(date).toLocaleDateString("en-US", { weekday: "narrow" })}
                    </div>
                    <div className="text-xs font-bold mt-1">{dayBurn > 0 ? `${dayBurn}` : "—"}</div>
                    <div className="text-[9px] text-muted-foreground">cal</div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Tips</CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground">Recommendations for staying active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-brand rounded-full mt-1.5 flex-shrink-0" />
              <p className="text-sm">
                Household activities like drawing water, cleaning, and washing contribute significantly to your daily
                calorie burn.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-brand rounded-full mt-1.5 flex-shrink-0" />
              <p className="text-sm">
                Walking for 30 minutes daily can help maintain a healthy weight and improve cardiovascular health.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-brand rounded-full mt-1.5 flex-shrink-0" />
              <p className="text-sm">
                Break up long periods of sitting with short activity breaks throughout the day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteEntryId !== null}
        onOpenChange={(open) => !open && setDeleteEntryId(null)}
        title="Delete Activity"
        description="Are you sure you want to delete this activity? This cannot be undone."
        onConfirm={() => {
          if (deleteEntryId) deleteActivity(deleteEntryId)
        }}
      />
    </div>
  )
}
