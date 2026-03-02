"use server"

import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { categorySchema } from "@/lib/validators"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "#ef4444", icon: "utensils" },
  { name: "Transport", color: "#3b82f6", icon: "car" },
  { name: "Utilities", color: "#eab308", icon: "zap" },
  { name: "Entertainment", color: "#a855f7", icon: "gamepad-2" },
  { name: "Shopping", color: "#ec4899", icon: "shopping-bag" },
  { name: "Health", color: "#22c55e", icon: "heart-pulse" },
  { name: "Education", color: "#06b6d4", icon: "graduation-cap" },
  { name: "Housing", color: "#f97316", icon: "home" },
  { name: "Insurance", color: "#64748b", icon: "shield" },
  { name: "Other", color: "#6b7280", icon: "circle" },
]

export async function getCategories() {
  const session = await requireSession()

  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, session.user.id))
    .orderBy(categories.name)
}

export async function seedDefaultCategories() {
  const session = await requireSession()

  const existing = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, session.user.id))

  if (existing.length > 0) return existing

  const created = await db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((cat) => ({
        userId: session.user.id,
        ...cat,
      }))
    )
    .returning()

  return created
}

export async function createCategory(data: unknown) {
  const session = await requireSession()
  const parsed = categorySchema.parse(data)

  const [created] = await db
    .insert(categories)
    .values({
      userId: session.user.id,
      name: parsed.name,
      color: parsed.color,
      icon: parsed.icon,
    })
    .returning()

  revalidatePath("/settings")
  revalidatePath("/expenses")
  return created
}

export async function updateCategory(id: string, data: unknown) {
  const session = await requireSession()
  const parsed = categorySchema.parse(data)

  const [updated] = await db
    .update(categories)
    .set({
      name: parsed.name,
      color: parsed.color,
      icon: parsed.icon,
    })
    .where(and(eq(categories.id, id), eq(categories.userId, session.user.id)))
    .returning()

  revalidatePath("/settings")
  revalidatePath("/expenses")
  return updated
}

export async function deleteCategory(id: string) {
  const session = await requireSession()

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, session.user.id)))

  revalidatePath("/settings")
  revalidatePath("/expenses")
}
