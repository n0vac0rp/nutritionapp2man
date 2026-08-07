"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SheetIcon as SleepIcon } from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { api } from "@/lib/api-client"
import { toDateKey, todayKey } from "../utils/dates"

interface SleepEntry {
  id: string; userId: string; date: string; hoursSlept: number
  sleepQuality: string; bedTime?: string | null; wakeTime?: string | null; notes?: string | null
}

export default function SleepTracker() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(todayKey())
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [hoursSlept, setHoursSlept] = useState(8)
  const [sleepQuality, setSleepQuality] = useState<string>("good")
  const [bedTime, setBedTime] = useState("")
  const [wakeTime, setWakeTime] = useState("")
  const [notes, setNotes] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.get<{ entries: SleepEntry[] }>("/api/sleep")
      setEntries(data.entries)
    } catch {}
  }, [user])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const navigateDate = (delta: number) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + delta)
    setCurrentDate(toDateKey(d))
  }

  const saveEntry = async () => {
    if (!user) return
    try {
      await api.post("/api/sleep", {
        date: currentDate,
        hoursSlept,
        sleepQuality,
        bedTime: bedTime || undefined,
        wakeTime: wakeTime || undefined,
        notes: notes || undefined,
      })
      setMessage("Entry saved")
      loadEntries()
      setTimeout(() => setMessage(null), 2000)
    } catch {
      setMessage("Failed to save")
    }
  }

  const todayEntry = entries.find((e) => toDateKey(e.date) === currentDate)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SleepIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Sleep Tracker
        </CardTitle>
        <CardDescription>Log your nightly sleep</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}>←</Button>
          <span className="font-medium">{currentDate}</span>
          <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>→</Button>
        </div>

        {todayEntry && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="font-medium">{todayEntry.hoursSlept}h — {todayEntry.sleepQuality}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label>Hours Slept</Label>
            <Select value={String(hoursSlept)} onValueChange={(v) => setHoursSlept(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 25 }, (_, i) => i * 0.5).filter((h) => h >= 3 && h <= 15).map((h) => (
                  <SelectItem key={h} value={String(h)}>{h}h</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quality</Label>
            <Select value={sleepQuality} onValueChange={setSleepQuality}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Bed Time</Label><input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" /></div>
            <div><Label>Wake Time</Label><input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." /></div>
        </div>

        <Button onClick={saveEntry} className="w-full">Save Entry</Button>
        {message && <p className="text-sm text-center text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  )
}
