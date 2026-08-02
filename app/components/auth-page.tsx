"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Utensils, CheckCircle, Eye, EyeOff } from "lucide-react"

export default function AuthPage() {
  const { login, signup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    waistCircumference: "",
    fistCircumference: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const result = await login(loginData.email, loginData.password)

    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Login failed" })
    }

    setIsLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // Validation
    if (signupData.password !== signupData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    if (signupData.password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" })
      setIsLoading(false)
      return
    }

    if (
      !signupData.fullName ||
      !signupData.email ||
      !signupData.age ||
      !signupData.gender ||
      !signupData.height ||
      !signupData.weight ||
      !signupData.fistCircumference
    ) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      setIsLoading(false)
      return
    }

    const userData = {
      fullName: signupData.fullName,
      email: signupData.email,
      password: signupData.password,
      age: Number.parseInt(signupData.age),
      gender: signupData.gender as "male" | "female" | "other",
      height: Number.parseFloat(signupData.height),
      weight: Number.parseFloat(signupData.weight),
      waistCircumference: signupData.waistCircumference ? Number.parseFloat(signupData.waistCircumference) : undefined,
      fistCircumference: Number.parseFloat(signupData.fistCircumference),
    }

    const result = await signup(userData)

    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Signup failed" })
    } else {
      setMessage({ type: "success", text: "Account created successfully! Welcome to GluGuide!" })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f5dc] bg-[rgba(243,251,242,1)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Utensils className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-green-700">GluGuide</h1>
          </div>
          <p className="text-lg text-green-600 font-medium">Smart Nutrition Monitoring System</p>
        </div>

        <Tabs defaultValue="login" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="login"
              className="h-10 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="h-10 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600">Sign in to your GluGuide account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="h-12 text-base text-gray-900 pr-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`flex items-center gap-3 text-sm p-4 rounded-lg border ${
                        message.type === "success"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      )}
                      <span className="font-medium">{message.text}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
                <CardDescription className="text-gray-600">
                  Join GluGuide to start monitoring your nutrition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700">
                      Full Name *
                    </Label>
                    <Input
                      id="signup-name"
                      placeholder="Enter your full name"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                      className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-age" className="text-sm font-medium text-gray-700">
                        Age *
                      </Label>
                      <Input
                        id="signup-age"
                        type="number"
                        placeholder="25"
                        min="13"
                        max="120"
                        value={signupData.age}
                        onChange={(e) => setSignupData({ ...signupData, age: e.target.value })}
                        required
                        className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-gender" className="text-sm font-medium text-gray-700">
                        Gender *
                      </Label>
                      <Select
                        value={signupData.gender}
                        onValueChange={(value) => setSignupData({ ...signupData, gender: value })}
                      >
                        <SelectTrigger className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-height" className="text-sm font-medium text-gray-700">
                        Height (cm) *
                      </Label>
                      <Input
                        id="signup-height"
                        type="number"
                        placeholder="170"
                        min="100"
                        max="250"
                        value={signupData.height}
                        onChange={(e) => setSignupData({ ...signupData, height: e.target.value })}
                        required
                        className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-weight" className="text-sm font-medium text-gray-700">
                        Weight (kg) *
                      </Label>
                      <Input
                        id="signup-weight"
                        type="number"
                        placeholder="70"
                        min="30"
                        max="300"
                        value={signupData.weight}
                        onChange={(e) => setSignupData({ ...signupData, weight: e.target.value })}
                        required
                        className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-waist" className="text-sm font-medium text-gray-700">
                      Waist Circumference (cm)
                    </Label>
                    <Input
                      id="signup-waist"
                      type="number"
                      placeholder="80"
                      max="200"
                      value={signupData.waistCircumference}
                      onChange={(e) => setSignupData({ ...signupData, waistCircumference: e.target.value })}
                      className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500">
                      Optional: Measure around your waist at the narrowest point for better health insights
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-fist" className="text-sm font-medium text-gray-700">
                      Fist Circumference (cm) *
                    </Label>
                    <Input
                      id="signup-fist"
                      type="number"
                      placeholder="25"
                      min="5"
                      max="50"
                      step="0.1"
                      value={signupData.fistCircumference}
                      onChange={(e) => setSignupData({ ...signupData, fistCircumference: e.target.value })}
                      required
                      className="h-12 text-base text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500">
                      Measure around your closed fist for personalized portion size calculation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        className="h-12 text-base text-gray-900 pr-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-gray-700">
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        required
                        className="h-12 text-base text-gray-900 pr-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`flex items-center gap-3 text-sm p-4 rounded-lg border ${
                        message.type === "success"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      )}
                      <span className="font-medium">{message.text}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
