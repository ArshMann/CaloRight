import "dotenv/config";
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const foods = [
  { name: "Apple", brand: null, caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { name: "Banana", brand: null, caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { name: "Orange", brand: null, caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1 },
  { name: "Strawberries", brand: null, caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 8, fatPer100g: 0.3 },
  { name: "Blueberries", brand: null, caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3 },
  { name: "Grapes", brand: null, caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2 },
  { name: "Pineapple", brand: null, caloriesPer100g: 50, proteinPer100g: 0.5, carbsPer100g: 13, fatPer100g: 0.1 },
  { name: "Mango", brand: null, caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4 },
  { name: "Pear", brand: null, caloriesPer100g: 57, proteinPer100g: 0.4, carbsPer100g: 15, fatPer100g: 0.1 },
  { name: "Watermelon", brand: null, caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 8, fatPer100g: 0.2 },
  { name: "Carrot", brand: null, caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2 },
  { name: "Broccoli", brand: null, caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { name: "Spinach", brand: null, caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 4, fatPer100g: 0.4 },
  { name: "Bell Pepper", brand: null, caloriesPer100g: 31, proteinPer100g: 1.0, carbsPer100g: 6, fatPer100g: 0.3 },
  { name: "Cucumber", brand: null, caloriesPer100g: 16, proteinPer100g: 0.8, carbsPer100g: 4, fatPer100g: 0.1 },
  { name: "Tomato", brand: null, caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 4, fatPer100g: 0.2 },
  { name: "Onion", brand: null, caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9, fatPer100g: 0.1 },
  { name: "Garlic", brand: null, caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33, fatPer100g: 0.5 },
  { name: "Potato", brand: null, caloriesPer100g: 77, proteinPer100g: 2.0, carbsPer100g: 17, fatPer100g: 0.1 },
  { name: "Sweet Potato", brand: null, caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { name: "Chicken Breast (raw)", brand: null, caloriesPer100g: 120, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 2 },
  { name: "Chicken Thigh (raw)", brand: null, caloriesPer100g: 177, proteinPer100g: 18, carbsPer100g: 0, fatPer100g: 11 },
  { name: "Turkey Breast", brand: null, caloriesPer100g: 135, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 1 },
  { name: "Lean Ground Beef", brand: null, caloriesPer100g: 176, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 10 },
  { name: "Sirloin Steak", brand: null, caloriesPer100g: 206, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 12 },
  { name: "Pork Chop", brand: null, caloriesPer100g: 231, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 14 },
  { name: "Salmon", brand: null, caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { name: "Tuna", brand: null, caloriesPer100g: 132, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 1 },
  { name: "Egg (whole)", brand: null, caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { name: "Egg White", brand: null, caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { name: "White Rice (cooked)", brand: null, caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { name: "Brown Rice (cooked)", brand: null, caloriesPer100g: 123, proteinPer100g: 2.7, carbsPer100g: 26, fatPer100g: 1 },
  { name: "Oats", brand: null, caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
  { name: "Quinoa (cooked)", brand: null, caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },
  { name: "Whole Wheat Bread", brand: null, caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 4 },
  { name: "Pasta (cooked)", brand: null, caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1 },
  { name: "Corn", brand: null, caloriesPer100g: 86, proteinPer100g: 3.2, carbsPer100g: 19, fatPer100g: 1.2 },
  { name: "Barley (cooked)", brand: null, caloriesPer100g: 123, proteinPer100g: 2.3, carbsPer100g: 28, fatPer100g: 0.4 },
  { name: "Black Beans (cooked)", brand: null, caloriesPer100g: 132, proteinPer100g: 9, carbsPer100g: 24, fatPer100g: 0.5 },
  { name: "Lentils (cooked)", brand: null, caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4 },
  { name: "Chickpeas (cooked)", brand: null, caloriesPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.6 },
  { name: "Kidney Beans", brand: null, caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 23, fatPer100g: 0.5 },
  { name: "Almonds", brand: null, caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { name: "Peanuts", brand: null, caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49 },
  { name: "Walnuts", brand: null, caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65 },
  { name: "Chia Seeds", brand: null, caloriesPer100g: 486, proteinPer100g: 17, carbsPer100g: 42, fatPer100g: 31 },
  { name: "Flax Seeds", brand: null, caloriesPer100g: 534, proteinPer100g: 18, carbsPer100g: 29, fatPer100g: 42 },
  { name: "Milk (2%)", brand: null, caloriesPer100g: 50, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 2 },
  { name: "Whole Milk", brand: null, caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 5, fatPer100g: 3.3 },
  { name: "Greek Yogurt (plain)", brand: null, caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: "Cheddar Cheese", brand: null, caloriesPer100g: 403, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33 },
  { name: "Cottage Cheese", brand: null, caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },
  { name: "Avocado", brand: null, caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15 },
  { name: "Olive Oil", brand: null, caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { name: "Butter", brand: null, caloriesPer100g: 717, proteinPer100g: 0.9, carbsPer100g: 0.1, fatPer100g: 81 },
  { name: "Honey", brand: null, caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0 },
  { name: "Dark Chocolate (70%)", brand: null, caloriesPer100g: 598, proteinPer100g: 7.8, carbsPer100g: 46, fatPer100g: 43 }
];

async function main() {
  await prisma.food.deleteMany({
    where: {
      userId: null,
    },
  })

  await prisma.food.createMany({
    data: foods,
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
