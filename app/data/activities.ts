export type ActivityIntensity = "light" | "moderate" | "vigorous"

export interface ActivityType {
  name: string
  caloriesPerMinute: Record<ActivityIntensity, number>
  image: string
  description: string
}

export const activityTypes: ActivityType[] = [
  {
    name: "Drawing Water",
    caloriesPerMinute: { light: 3, moderate: 5, vigorous: 7 },
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_1.PNG-hQIIxT5RenhxVXkJ95C0trdberZN6b.png",
    description: "Fetching water from well or storage",
  },
  {
    name: "Walking",
    caloriesPerMinute: { light: 3, moderate: 4, vigorous: 5 },
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_2.PNG-GPkiI37cW37NOsQGo7OR3knAijtVsx.png",
    description: "Walking for transportation or exercise",
  },
  {
    name: "Car Wash",
    caloriesPerMinute: { light: 3, moderate: 5, vigorous: 6 },
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_3.PNG-oHY8wJHBxoHkdiIPQlKy5u95O6XTKu.png",
    description: "Washing and cleaning vehicles",
  },
  {
    name: "Cleaning Outside",
    caloriesPerMinute: { light: 3, moderate: 4, vigorous: 5 },
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_4.PNG-ZRG7q14MbPt7JcAXaOuwXOLcxCch11.png",
    description: "Sweeping and cleaning outdoor areas",
  },
  {
    name: "Cleaning House",
    caloriesPerMinute: { light: 2, moderate: 4, vigorous: 5 },
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_5.PNG-MLSXWWfvr8MazdHU2Bc0e1olAIzrv6.png",
    description: "Mopping and cleaning indoor spaces",
  },
  {
    name: "Outdoor House Work",
    caloriesPerMinute: { light: 4, moderate: 6, vigorous: 8 },
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/file_6.PNG-coJrVC32qFqKq6h32WeUYEZE5tHw6j.png",
    description: "General outdoor household chores",
  },
]

export const DEFAULT_CALORIES_PER_MINUTE = 4

export function getCaloriesPerMinute(activityType: string, intensity: ActivityIntensity): number {
  const activity = activityTypes.find((a) => a.name === activityType)
  return activity?.caloriesPerMinute[intensity] ?? DEFAULT_CALORIES_PER_MINUTE
}
