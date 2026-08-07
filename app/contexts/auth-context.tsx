"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { api, setToken, getToken, ApiError } from "@/lib/api-client"

export interface User {
  id: string
  email: string
  fullName: string
  age: number
  gender: "male" | "female" | "other"
  height: number
  weight: number
  waistCircumference?: number | null
  hipCircumference?: number | null
  fistCircumference?: number | null
  location?: string | null
  occupation?: string | null
  healthConditions?: string[]
  fitnessGoals?: string[]
  // Prisma enums are returned verbatim, so these are the uppercase DB values.
  role: "USER" | "ADMIN"
  tutorialCompleted?: boolean
  appRated?: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: {
    fullName: string
    email: string
    password: string
    age: number
    gender: "male" | "female" | "other"
    height: number
    weight: number
    waistCircumference?: number
    hipCircumference?: number
    fistCircumference: number
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  refreshUser: () => Promise<void>
  showTutorial: boolean
  completeTutorial: () => void
  skipTutorial: () => void
  showRatingDialog: boolean
  closeRatingDialog: () => void
  markAppRated: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const ratingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkAuth = useCallback(async () => {
    const t = getToken()
    if (!t) {
      setIsLoading(false)
      return
    }
    try {
      const { user: u } = await api.get<{ user: User }>("/api/auth/me")
      setUser(u)
      if (!u.tutorialCompleted) setShowTutorial(true)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Depends on the individual flags rather than the whole `user` object: any
  // profile update replaces `user`, which would otherwise cancel and restart
  // the countdown every time.
  const tutorialCompleted = user?.tutorialCompleted
  const appRated = user?.appRated
  useEffect(() => {
    if (!tutorialCompleted || appRated) return
    ratingTimer.current = setTimeout(() => {
      setShowRatingDialog(true)
      ratingTimer.current = null
    }, 60000)
    return () => {
      if (ratingTimer.current) {
        clearTimeout(ratingTimer.current)
        ratingTimer.current = null
      }
    }
  }, [tutorialCompleted, appRated])

  const login = async (email: string, password: string) => {
    try {
      const data = await api.post<{ user: User; token: string }>("/api/auth/login", { email, password })
      setToken(data.token)
      setUser(data.user)
      if (!data.user.tutorialCompleted) setShowTutorial(true)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof ApiError ? err.message : "Login failed" }
    }
  }

  const signup = async (userData: {
    fullName: string; email: string; password: string; age: number
    gender: "male" | "female" | "other"; height: number; weight: number
    waistCircumference?: number; hipCircumference?: number; fistCircumference: number
  }) => {
    try {
      const data = await api.post<{ user: User; token: string }>("/api/auth/signup", userData)
      setToken(data.token)
      setUser(data.user)
      setShowTutorial(true)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof ApiError ? err.message : "Signup failed" }
    }
  }

  const logout = async () => {
    try { await api.post("/api/auth/logout") } catch {}
    setToken(null)
    setUser(null)
    setShowTutorial(false)
    setShowRatingDialog(false)
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      const { user: updated } = await api.patch<{ user: User }>("/api/users/me", updates)
      setUser(updated)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof ApiError ? err.message : "Update failed" }
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const completeTutorial = () => {
    setShowTutorial(false)
    updateProfile({ tutorialCompleted: true })
  }

  const skipTutorial = () => {
    setShowTutorial(false)
    updateProfile({ tutorialCompleted: true })
  }

  const closeRatingDialog = () => {
    setShowRatingDialog(false)
  }

  const markAppRated = () => {
    setShowRatingDialog(false)
    updateProfile({ appRated: true })
  }

  return (
    <AuthContext.Provider
      value={{
        user, login, signup, logout, updateProfile,
        isLoading, refreshUser,
        showTutorial, completeTutorial, skipTutorial,
        showRatingDialog, closeRatingDialog, markAppRated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
