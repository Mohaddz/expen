"use server"

import { db } from "@/lib/db"
import { customSubscriptionServices } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { customServiceSchema } from "@/lib/validators"
import { eq, and, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getCustomServices() {
  const session = await requireSession()

  return db
    .select()
    .from(customSubscriptionServices)
    .where(eq(customSubscriptionServices.userId, session.user.id))
    .orderBy(asc(customSubscriptionServices.name))
}

export async function createCustomService(data: unknown) {
  const session = await requireSession()
  const parsed = customServiceSchema.parse(data)

  // Check for duplicate
  const existing = await db
    .select()
    .from(customSubscriptionServices)
    .where(
      and(
        eq(customSubscriptionServices.userId, session.user.id),
        eq(customSubscriptionServices.name, parsed.name)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  const [created] = await db
    .insert(customSubscriptionServices)
    .values({
      userId: session.user.id,
      name: parsed.name,
    })
    .returning()

  revalidatePath("/settings")
  revalidatePath("/subscriptions")
  return created
}

export async function updateCustomService(id: string, data: unknown) {
  const session = await requireSession()
  const parsed = customServiceSchema.parse(data)

  const [updated] = await db
    .update(customSubscriptionServices)
    .set({ name: parsed.name })
    .where(
      and(
        eq(customSubscriptionServices.id, id),
        eq(customSubscriptionServices.userId, session.user.id)
      )
    )
    .returning()

  revalidatePath("/settings")
  revalidatePath("/subscriptions")
  return updated
}

export async function deleteCustomService(id: string) {
  const session = await requireSession()

  await db
    .delete(customSubscriptionServices)
    .where(
      and(
        eq(customSubscriptionServices.id, id),
        eq(customSubscriptionServices.userId, session.user.id)
      )
    )

  revalidatePath("/settings")
  revalidatePath("/subscriptions")
}

export async function migrateCustomServicesFromLocal(names: string[]) {
  const session = await requireSession()
  if (!names.length) return

  // Get existing names to avoid duplicates
  const existing = await db
    .select({ name: customSubscriptionServices.name })
    .from(customSubscriptionServices)
    .where(eq(customSubscriptionServices.userId, session.user.id))

  const existingNames = new Set(existing.map((e) => e.name))
  const newNames = names.filter((n) => n.trim() && !existingNames.has(n))

  if (newNames.length > 0) {
    await db.insert(customSubscriptionServices).values(
      newNames.map((name) => ({
        userId: session.user.id,
        name,
      }))
    )
  }

  revalidatePath("/settings")
  revalidatePath("/subscriptions")
}
