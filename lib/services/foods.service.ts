import * as foodRepo from "@/lib/db/repositories/food.repository"

export async function searchFoods(opts?: {
  search?: string
  category?: string
  page?: number
  limit?: number
}) {
  return foodRepo.findAll(opts)
}

export async function getFood(id: string) {
  return foodRepo.findById(id)
}

export async function getCategories() {
  return foodRepo.findAllCategories()
}
