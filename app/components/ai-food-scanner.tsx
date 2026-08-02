"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera, Upload, AlertCircle, CheckCircle, Loader2, X, Utensils, Plus } from "lucide-react"
import { useMeals } from "../hooks/use-meals"

interface Prediction {
  class_name: string
  confidence: number
}

interface PredictResult {
  predictions: Prediction[]
  top_prediction: Prediction
  inference_time_ms: number
}

const CONFIDENCE_THRESHOLD = 0.7

interface AIFoodScannerProps {
  onFoodIdentified?: (foodName: string) => void
  onRescan?: () => void
}

export default function AIFoodScanner({ onFoodIdentified, onRescan }: AIFoodScannerProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<PredictResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addMeal } = useMeals()

  const handleFileSelect = (file: File) => {
    const accepted = ["image/jpeg", "image/png", "image/webp"]
    if (!accepted.includes(file.type)) {
      setError("Unsupported format. Upload JPEG, PNG, or WebP.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Maximum 10 MB.")
      return
    }
    setError(null)
    setResult(null)
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleScan = async () => {
    if (!selectedFile) return
    setIsScanning(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/ai/predict", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Classification failed")
      }

      setResult(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to classify image")
    } finally {
      setIsScanning(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Camera className="h-5 w-5 text-green-600 dark:text-green-400" />
            AI Food Scanner
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Upload a photo of Nigerian starchy food to identify it. Currently detects: Amala, Eba, Pounded Yam,
            and Semo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-green-500/50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Drop a food image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — max 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border max-h-64 flex items-center justify-center bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Food preview"
                  className="max-w-full max-h-64 object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Scan Food
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClear} disabled={isScanning}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Classification Result
            </CardTitle>
            <CardDescription>Inference completed in {result.inference_time_ms.toFixed(0)} ms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-1">Top match</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-bold">{result.top_prediction.class_name}</h3>
                <span className="text-lg font-semibold text-green-700 dark:text-green-400">
                  {(result.top_prediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
              {result.top_prediction.confidence < CONFIDENCE_THRESHOLD && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Low confidence — verify this result before relying on it.
                </p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">All Predictions</h4>
              <div className="space-y-3">
                {result.predictions.map((p) => (
                  <div key={p.class_name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{p.class_name}</span>
                      <span className="text-muted-foreground">{(p.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={p.confidence * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            {onFoodIdentified ? (
              <Button
                onClick={() => onFoodIdentified(result.top_prediction.class_name)}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {result.top_prediction.class_name} to Meal
              </Button>
            ) : (
              <>
                <Button
                  onClick={async () => {
                    if (!result) return
                    setIsSaving(true)
                    setSaveMsg(null)
                    const now = new Date()
                    try {
                      const r = await addMeal({
                        type: "SNACK",
                        date: now.toISOString().split("T")[0],
                        time: now.toTimeString().split(" ")[0].substring(0, 5),
                        foods: [{
                          name: result.top_prediction.class_name,
                          grams: 100,
                          nutrition: { calories: 150, protein: 3, carbs: 20, fats: 1, fiber: 2, iron: 1, vitaminA: 50 },
                        }],
                      })
                      if (r.success) { setSaveMsg("Saved to meals!") } else { setSaveMsg("Failed to save") }
                      setTimeout(() => setSaveMsg(null), 3000)
                    } catch { setSaveMsg("Failed to save") }
                    finally { setIsSaving(false) }
                  }}
                  disabled={isSaving}
                  className="w-full mt-4"
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : `Log as ${result.top_prediction.class_name}`}
                </Button>
                {saveMsg && <p className="text-sm text-center text-green-600 mt-2">{saveMsg}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
