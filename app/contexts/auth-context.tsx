"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
  role: "user" | "admin"
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)

  const checkAuth = useCallback(async () => {
    const t = getToken()
    if (!t) {
      setIsLoading(false)
      return
    }
    try {
      const u = await api.get<User>("/api/auth/me")
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

  const login = async (email: string, password: string) => {
    try {
      const data = await api.post<{ user: User; token: string }>("/api/auth/login", { email, password })
      setToken(data.token)
      setUser(data.user)
      if (!data.user.tutorialCompleted) setShowTutorial(true)
      setTimeout(() => {
        if (!data.user.appRated) setShowRatingDialog(true)
      }, 1500)
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
      const updated = await api.patch<User>("/api/users/me", updates)
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
  }

  const skipTutorial = () => {
    setShowTutorial(false)
  }

  const closeRatingDialog = () => {
    setShowRatingDialog(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user, login, signup, logout, updateProfile,
        isLoading, refreshUser,
        showTutorial, completeTutorial, skipTutorial,
        showRatingDialog, closeRatingDialog,
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
