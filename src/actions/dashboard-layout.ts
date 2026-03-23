"use server"

import { db } from "@/lib/db"
import { dashboardLayouts } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { eq } from "drizzle-orm"

export async function getDashboardLayout() {
  const session = await requireSession()

  const [result] = await db
    .select()
    .from(dashboardLayouts)
    .where(eq(dashboardLayouts.userId, session.user.id))
    .limit(1)

  if (!result) return null

  return {
    layout: result.layout as Array<{
      i: string
      x: number
      y: number
      w: number
      h: number
    }>,
    hiddenWidgets: result.hiddenWidgets as string[],
  }
}

export async function saveDashboardLayout(
  layout: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  hiddenWidgets: string[]
) {
  const session = await requireSession()

  await db
    .insert(dashboardLayouts)
    .values({
      userId: session.user.id,
      layout,
      hiddenWidgets,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dashboardLayouts.userId,
      set: {
        layout,
        hiddenWidgets,
        updatedAt: new Date(),
      },
    })
}

export async function resetDashboardLayout() {
  const session = await requireSession()

  await db
    .delete(dashboardLayouts)
    .where(eq(dashboardLayouts.userId, session.user.id))
}
