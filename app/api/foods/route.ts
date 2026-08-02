import { NextRequest } from "next/server"
import { z } from "zod"
import { parseQuery, handleApiError, successResponse } from "@/lib/api-helpers"
import * as foodsService from "@/lib/services/foods.service"

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export async function GET(req: NextRequest) {
  try {
    const query = parseQuery(req, querySchema)
    const result = await foodsService.searchFoods(query)
    return successResponse(result)
  } catch (err) {
    return handleApiError(err)
  }
}
