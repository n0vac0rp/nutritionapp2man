import "dotenv/config"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const foods = [
  { id: "amala-yam-flour", name: "Amala (Yam flour)", category: "Whole Grains and Tubers", calories: 110, protein: 2.5, carbs: 25.0, fats: 0.5, fiber: 2.0, iron: 0.6, vitaminA: 100, description: "Cooked yam flour swallow", servingSize: "1 ladle (100g cooked)", servingWeight: 100, portionCalories: { small: 110, medium: 260, large: 390 } },
  { id: "eba-garri-cooked", name: "Eba (Garri, cooked)", category: "Whole Grains and Tubers", calories: 180, protein: 1.8, carbs: 42.0, fats: 0.8, fiber: 1.5, iron: 0.9, vitaminA: 10, description: "Cassava flour swallow", servingSize: "1 ladle (100g cooked)", servingWeight: 100, portionCalories: { small: 180, medium: 430, large: 640 } },
  { id: "pounded-yam", name: "Pounded Yam", category: "Whole Grains and Tubers", calories: 120, protein: 2.2, carbs: 28.0, fats: 0.3, fiber: 3.5, iron: 0.8, vitaminA: 120, description: "Pounded yam swallow", servingSize: "1 ladle (100g cooked)", servingWeight: 100, portionCalories: { small: 120, medium: 290, large: 430 } },
  { id: "fufu-fermented-cassava", name: "Fufu (Fermented cassava)", category: "Whole Grains and Tubers", calories: 150, protein: 1.5, carbs: 35.0, fats: 0.6, fiber: 2.0, iron: 0.7, vitaminA: 50, description: "Fermented cassava swallow", servingSize: "1 ladle (100g cooked)", servingWeight: 100, portionCalories: { small: 150, medium: 360, large: 540 } },
  { id: "plantain-amala", name: "Plantain Amala", category: "Whole Grains and Tubers", calories: 95, protein: 1.2, carbs: 22.0, fats: 0.4, fiber: 2.8, iron: 0.5, vitaminA: 950, description: "Plantain flour swallow", servingSize: "1 ladle (100g cooked)", servingWeight: 100, portionCalories: { small: 95, medium: 230, large: 345 } },
  { id: "cooked-rice", name: "Cooked Rice (Iresi)", category: "Whole Grains and Tubers", calories: 260, protein: 5.3, carbs: 56.0, fats: 0.6, fiber: 1.2, iron: 0.8, vitaminA: 0, description: "Cooked white rice, Nigerian staple", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 260, medium: 520, large: 780 } },
  { id: "boiled-yam", name: "Boiled Yam (Isu)", category: "Whole Grains and Tubers", calories: 220, protein: 2.8, carbs: 52.0, fats: 0.3, fiber: 4.1, iron: 0.9, vitaminA: 138, description: "Boiled yam, rich in carbohydrates", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 220, medium: 440, large: 660 } },
  { id: "boiled-plantain", name: "Boiled Plantain (Ogede dodo)", category: "Whole Grains and Tubers", calories: 180, protein: 1.9, carbs: 47.0, fats: 0.4, fiber: 3.4, iron: 0.6, vitaminA: 1127, description: "Boiled ripe plantain", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 180, medium: 360, large: 540 } },
  { id: "pap-ogi", name: "Cooked Maize (Pap/Ogi)", category: "Whole Grains and Tubers", calories: 150, protein: 3.2, carbs: 32.0, fats: 1.5, fiber: 2.4, iron: 1.2, vitaminA: 214, description: "Fermented corn porridge", servingSize: "1 cup (240ml)", servingWeight: 240, portionCalories: { small: 150, medium: 300, large: 450 } },
  { id: "garri-eba", name: "Cooked Garri (Eba)", category: "Whole Grains and Tubers", calories: 260, protein: 1.4, carbs: 62.0, fats: 0.5, fiber: 1.8, iron: 1.1, vitaminA: 13, description: "Cassava flour swallow", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 260, medium: 520, large: 780 } },
  { id: "semovita", name: "Cooked Semovita (Semo)", category: "Whole Grains and Tubers", calories: 250, protein: 8.6, carbs: 52.0, fats: 1.2, fiber: 2.1, iron: 1.8, vitaminA: 0, description: "Semolina swallow", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 250, medium: 500, large: 750 } },
  { id: "wheat-swallow", name: "Cooked Wheat (Swallow)", category: "Whole Grains and Tubers", calories: 230, protein: 8.0, carbs: 48.0, fats: 1.2, fiber: 6.0, iron: 2.5, vitaminA: 0, description: "Wheat flour swallow", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 230, medium: 460, large: 690 } },
  { id: "irish-potatoes", name: "Boiled Irish Potatoes", category: "Whole Grains and Tubers", calories: 170, protein: 3.6, carbs: 39.0, fats: 0.2, fiber: 3.8, iron: 1.5, vitaminA: 7, description: "Boiled white potatoes", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 170, medium: 340, large: 510 } },
  { id: "sweet-potatoes", name: "Boiled Sweet Potatoes", category: "Whole Grains and Tubers", calories: 180, protein: 3.2, carbs: 41.0, fats: 0.3, fiber: 6.0, iron: 1.2, vitaminA: 19218, description: "Boiled sweet potatoes, rich in vitamin A", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 180, medium: 360, large: 540 } },
  { id: "sliced-bread-white-wheat", name: "Sliced Bread (White/Whole wheat)", category: "Whole Grains and Tubers", calories: 73, protein: 2.7, carbs: 14.0, fats: 1.0, fiber: 2.4, iron: 1.5, vitaminA: 0, description: "White or whole wheat bread slice", servingSize: "1 slice (~25g)", servingWeight: 25, portionCalories: { small: 73, medium: 146, large: 219 } },
  { id: "agege-bread-soft-loaf", name: "Agege Bread (Soft loaf)", category: "Whole Grains and Tubers", calories: 105, protein: 3.0, carbs: 20.0, fats: 1.2, fiber: 1.8, iron: 1.2, vitaminA: 0, description: "Soft Nigerian bread loaf, medium slice", servingSize: "1 medium slice (~40g)", servingWeight: 40, portionCalories: { small: 105, medium: 210, large: 315 } },
  { id: "sweetened-butter-loaf-bread", name: "Sweetened/Butter Loaf Bread", category: "Whole Grains and Tubers", calories: 120, protein: 3.2, carbs: 22.0, fats: 2.0, fiber: 1.5, iron: 1.4, vitaminA: 50, description: "Sweetened or butter enriched bread slice", servingSize: "1 slice (~35g)", servingWeight: 35, portionCalories: { small: 120, medium: 240, large: 360 } },
  { id: "eko-agidi-plain-white-wrap", name: "Eko/Agidi (plain, white)", category: "Whole Grains and Tubers", calories: 150, protein: 2.0, carbs: 34.0, fats: 0.5, fiber: 1.8, iron: 0.7, vitaminA: 0, description: "Plain white corn pudding wrap", servingSize: "1 wrap (~200g)", servingWeight: 200, portionCalories: { small: 130, medium: 150, large: 170 } },
  { id: "jollof-rice-standard", name: "Jollof Rice (standard)", category: "Whole Grains and Tubers", calories: 275, protein: 5.5, carbs: 58.0, fats: 2.5, fiber: 1.5, iron: 1.0, vitaminA: 300, description: "Standard Jollof rice", servingSize: "1 cup (~250g cooked)", servingWeight: 250, portionCalories: { small: 125, medium: 150, large: 300 } },
  { id: "boiled-beans", name: "Boiled Beans (Ewa)", category: "Legumes", calories: 240, protein: 15.2, carbs: 42.0, fats: 1.2, fiber: 15.0, iron: 4.8, vitaminA: 7, description: "Cooked Nigerian brown beans", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 240, medium: 480, large: 720 } },
  { id: "moin-moin", name: "Moin-Moin", category: "Legumes", calories: 230, protein: 14.0, carbs: 38.0, fats: 3.5, fiber: 12.0, iron: 4.2, vitaminA: 450, description: "Steamed bean pudding", servingSize: "1 wrap (200g)", servingWeight: 200, portionCalories: { small: 230, medium: 460, large: 690 } },
  { id: "akara", name: "Akara (Bean Cake)", category: "Legumes", calories: 300, protein: 12.0, carbs: 32.0, fats: 14.0, fiber: 10.0, iron: 3.8, vitaminA: 120, description: "Fried bean cakes", servingSize: "3 balls (200g)", servingWeight: 200, portionCalories: { small: 300, medium: 600, large: 900 } },
  { id: "okpa", name: "Boiled Bambara Nut (Okpa)", category: "Legumes", calories: 250, protein: 16.0, carbs: 40.0, fats: 2.8, fiber: 8.0, iron: 3.5, vitaminA: 50, description: "Bambara nut pudding", servingSize: "1 wrap (200g)", servingWeight: 200, portionCalories: { small: 250, medium: 500, large: 750 } },
  { id: "groundnut", name: "Groundnut (Epa)", category: "Nuts and Seeds", calories: 250, protein: 10.0, carbs: 8.0, fats: 21.0, fiber: 3.6, iron: 1.8, vitaminA: 0, description: "Roasted peanuts", servingSize: "1 handful (40g)", servingWeight: 40, portionCalories: { small: 250, medium: 500, large: 750 } },
  { id: "egusi", name: "Egusi (Melon Seed)", category: "Nuts and Seeds", calories: 240, protein: 11.2, carbs: 5.6, fats: 20.0, fiber: 2.8, iron: 3.2, vitaminA: 0, description: "Melon seeds for soup", servingSize: "1 handful (40g)", servingWeight: 40, portionCalories: { small: 240, medium: 480, large: 720 } },
  { id: "orange", name: "Orange (Osan)", category: "Fruits", calories: 60, protein: 1.2, carbs: 15.0, fats: 0.2, fiber: 3.1, iron: 0.1, vitaminA: 225, description: "Fresh orange", servingSize: "1 medium", servingWeight: 130, portionCalories: { small: 60, medium: 120, large: 180 } },
  { id: "banana", name: "Banana (Ogede)", category: "Fruits", calories: 100, protein: 1.3, carbs: 27.0, fats: 0.3, fiber: 3.1, iron: 0.3, vitaminA: 76, description: "Ripe banana", servingSize: "1 medium (120g)", servingWeight: 120, portionCalories: { small: 100, medium: 200, large: 300 } },
  { id: "mango", name: "Mango (Mangoro)", category: "Fruits", calories: 90, protein: 1.4, carbs: 24.0, fats: 0.6, fiber: 2.6, iron: 0.2, vitaminA: 1082, description: "Fresh mango", servingSize: "1 small (150g)", servingWeight: 150, portionCalories: { small: 90, medium: 180, large: 270 } },
  { id: "apple", name: "Apple (Apù)", category: "Fruits", calories: 80, protein: 0.4, carbs: 21.0, fats: 0.3, fiber: 3.6, iron: 0.2, vitaminA: 98, description: "Fresh apple", servingSize: "1 medium", servingWeight: 150, portionCalories: { small: 80, medium: 160, large: 240 } },
  { id: "watermelon", name: "Watermelon (Egunsi omi)", category: "Fruits", calories: 60, protein: 1.2, carbs: 15.0, fats: 0.3, fiber: 0.8, iron: 0.5, vitaminA: 569, description: "Fresh watermelon", servingSize: "1 wedge (200g)", servingWeight: 200, portionCalories: { small: 60, medium: 120, large: 180 } },
  { id: "pawpaw", name: "Pawpaw (Ibepe)", category: "Fruits", calories: 80, protein: 0.9, carbs: 21.0, fats: 0.4, fiber: 2.5, iron: 0.5, vitaminA: 1094, description: "Fresh papaya", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 80, medium: 160, large: 240 } },
  { id: "pineapple", name: "Pineapple (Ope oyinbo)", category: "Fruits", calories: 90, protein: 1.1, carbs: 24.0, fats: 0.2, fiber: 2.8, iron: 0.6, vitaminA: 96, description: "Fresh pineapple", servingSize: "1 fist (200g)", servingWeight: 200, portionCalories: { small: 90, medium: 180, large: 270 } },
  { id: "spinach", name: "Spinach (Efo tete)", category: "Vegetables", calories: 35, protein: 4.3, carbs: 5.5, fats: 0.6, fiber: 3.2, iron: 4.1, vitaminA: 9377, description: "Cooked spinach", servingSize: "1 fist (100g cooked)", servingWeight: 100, portionCalories: { small: 35, medium: 70, large: 105 } },
  { id: "ugu", name: "Fluted Pumpkin Leaves (Ugu)", category: "Vegetables", calories: 40, protein: 5.0, carbs: 6.0, fats: 0.8, fiber: 3.5, iron: 3.8, vitaminA: 8500, description: "Cooked pumpkin leaves", servingSize: "1 fist (100g cooked)", servingWeight: 100, portionCalories: { small: 40, medium: 80, large: 120 } },
  { id: "okra", name: "Okra (Ila)", category: "Vegetables", calories: 40, protein: 2.0, carbs: 8.0, fats: 0.2, fiber: 3.2, iron: 0.8, vitaminA: 716, description: "Cooked okra", servingSize: "1 fist (100g cooked)", servingWeight: 100, portionCalories: { small: 40, medium: 80, large: 120 } },
  { id: "tomato", name: "Tomato (Tomati)", category: "Vegetables", calories: 20, protein: 1.0, carbs: 4.0, fats: 0.2, fiber: 1.2, iron: 0.3, vitaminA: 833, description: "Fresh tomato", servingSize: "1 medium (100g)", servingWeight: 100, portionCalories: { small: 20, medium: 40, large: 60 } },
  { id: "garden-egg", name: "Garden Egg (Igba)", category: "Vegetables", calories: 35, protein: 1.4, carbs: 8.0, fats: 0.2, fiber: 3.0, iron: 0.4, vitaminA: 23, description: "Fresh garden egg", servingSize: "2 pieces (100g)", servingWeight: 100, portionCalories: { small: 35, medium: 70, large: 105 } },
  { id: "cabbage", name: "Cabbage (Efo oyinbo)", category: "Vegetables", calories: 25, protein: 1.3, carbs: 6.0, fats: 0.1, fiber: 2.5, iron: 0.5, vitaminA: 98, description: "Fresh cabbage", servingSize: "1 fist (100g)", servingWeight: 100, portionCalories: { small: 25, medium: 50, large: 75 } },
  { id: "carrot", name: "Carrot (Karooti)", category: "Vegetables", calories: 45, protein: 1.0, carbs: 10.0, fats: 0.2, fiber: 2.8, iron: 0.3, vitaminA: 16706, description: "Fresh carrot", servingSize: "1 fist (100g)", servingWeight: 100, portionCalories: { small: 45, medium: 90, large: 135 } },
  { id: "whole-milk", name: "Whole Liquid Milk", category: "Milk and Milk Products", calories: 150, protein: 7.7, carbs: 11.0, fats: 8.0, fiber: 0, iron: 0.1, vitaminA: 395, description: "Full-fat milk", servingSize: "1 cup (240ml)", servingWeight: 240, portionCalories: { small: 150, medium: 300, large: 450 } },
  { id: "yogurt", name: "Yogurt (Plain)", category: "Milk and Milk Products", calories: 120, protein: 10.0, carbs: 17.0, fats: 0.4, fiber: 0, iron: 0.2, vitaminA: 17, description: "Plain yogurt", servingSize: "1 cup (240ml)", servingWeight: 240, portionCalories: { small: 120, medium: 240, large: 360 } },
  { id: "boiled-egg", name: "Boiled Egg (Eyim)", category: "Meat, Fish, and Poultry", calories: 80, protein: 6.3, carbs: 0.6, fats: 5.7, fiber: 0, iron: 1.2, vitaminA: 270, description: "Large boiled egg", servingSize: "1 large", servingWeight: 50, portionCalories: { small: 80, medium: 160, large: 240 } },
  { id: "chicken", name: "Chicken (Adie)", category: "Meat, Fish, and Poultry", calories: 180, protein: 27.0, carbs: 0, fats: 7.4, fiber: 0, iron: 1.0, vitaminA: 49, description: "Cooked chicken breast", servingSize: "1 fist (90g)", servingWeight: 90, portionCalories: { small: 180, medium: 360, large: 540 } },
  { id: "beef", name: "Beef (Eran malu)", category: "Meat, Fish, and Poultry", calories: 200, protein: 26.0, carbs: 0, fats: 10.0, fiber: 0, iron: 2.6, vitaminA: 0, description: "Cooked beef", servingSize: "1 fist (90g)", servingWeight: 90, portionCalories: { small: 200, medium: 400, large: 600 } },
  { id: "fish", name: "Fish (Eja)", category: "Meat, Fish, and Poultry", calories: 170, protein: 25.0, carbs: 0, fats: 7.0, fiber: 0, iron: 0.8, vitaminA: 54, description: "Cooked fish", servingSize: "1 fist (90g)", servingWeight: 90, portionCalories: { small: 170, medium: 340, large: 510 } },
  { id: "palm-oil", name: "Palm Oil (Epo pupa)", category: "Oils and Fats", calories: 45, protein: 0, carbs: 0, fats: 5.0, fiber: 0, iron: 0, vitaminA: 0, description: "Red palm oil", servingSize: "1 tsp (5ml)", servingWeight: 5, portionCalories: { small: 45, medium: 90, large: 135 } },
  { id: "zobo", name: "Zobo Drink (Unsweetened)", category: "Beverages", calories: 50, protein: 0.4, carbs: 12.0, fats: 0.1, fiber: 0.3, iron: 8.6, vitaminA: 287, description: "Hibiscus drink", servingSize: "1 cup (240ml)", servingWeight: 240, portionCalories: { small: 50, medium: 100, large: 150 } },
]

async function main() {
  console.log("Seeding NigerianFood catalog...")
  let created = 0

  for (const f of foods) {
    const scale = 100 / f.servingWeight
    await prisma.nigerianFood.upsert({
      where: { id: f.id },
      create: {
        id: f.id, name: f.name, category: f.category, description: f.description,
        servingSize: f.servingSize, servingWeight: f.servingWeight,
        caloriesPer100g: Math.round(f.calories * scale * 10) / 10,
        proteinPer100g: Math.round(f.protein * scale * 10) / 10,
        carbsPer100g: Math.round(f.carbs * scale * 10) / 10,
        fatsPer100g: Math.round(f.fats * scale * 10) / 10,
        fiberPer100g: Math.round(f.fiber * scale * 10) / 10,
        ironPer100g: Math.round(f.iron * scale * 10) / 10,
        vitaminAPer100g: Math.round(f.vitaminA * scale * 10) / 10,
        portionCalSmall: f.portionCalories.small,
        portionCalMedium: f.portionCalories.medium,
        portionCalLarge: f.portionCalories.large,
      },
      update: {
        name: f.name, category: f.category, description: f.description,
        servingSize: f.servingSize, servingWeight: f.servingWeight,
        caloriesPer100g: Math.round(f.calories * scale * 10) / 10,
        proteinPer100g: Math.round(f.protein * scale * 10) / 10,
        carbsPer100g: Math.round(f.carbs * scale * 10) / 10,
        fatsPer100g: Math.round(f.fats * scale * 10) / 10,
        fiberPer100g: Math.round(f.fiber * scale * 10) / 10,
        ironPer100g: Math.round(f.iron * scale * 10) / 10,
        vitaminAPer100g: Math.round(f.vitaminA * scale * 10) / 10,
        portionCalSmall: f.portionCalories.small,
        portionCalMedium: f.portionCalories.medium,
        portionCalLarge: f.portionCalories.large,
      },
    })
    created++
  }

  console.log(`Seeded ${created} foods`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
