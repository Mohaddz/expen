"use server"

import { db } from "@/lib/db"
import { invoices, expenses } from "@/lib/db/schema"
import { requireSession } from "@/lib/session"
import { extractInvoiceData } from "@/lib/ocr"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createInvoice(data: {
  fileKey: string
  fileName: string
}) {
  const session = await requireSession()

  const [invoice] = await db
    .insert(invoices)
    .values({
      userId: session.user.id,
      fileKey: data.fileKey,
      fileName: data.fileName,
      ocrStatus: "pending",
    })
    .returning()

  revalidatePath("/upload")
  return invoice
}

export async function processInvoiceOcr(
  invoiceId: string,
  imageBase64: string,
  mimeType: string
) {
  const session = await requireSession()

  await db
    .update(invoices)
    .set({ ocrStatus: "processing" })
    .where(
      and(eq(invoices.id, invoiceId), eq(invoices.userId, session.user.id))
    )

  try {
    const ocrData = await extractInvoiceData(imageBase64, mimeType)

    await db
      .update(invoices)
      .set({
        ocrData,
        ocrStatus: "completed",
        vendor: ocrData.vendor,
      })
      .where(eq(invoices.id, invoiceId))

    revalidatePath("/upload")
    return ocrData
  } catch (error) {
    await db
      .update(invoices)
      .set({ ocrStatus: "failed" })
      .where(eq(invoices.id, invoiceId))

    throw error
  }
}

export async function createExpenseFromInvoice(data: {
  invoiceId: string
  title: string
  amount: string
  currency: string
  date: string
  categoryId?: string | null
}) {
  const session = await requireSession()

  const [expense] = await db
    .insert(expenses)
    .values({
      userId: session.user.id,
      invoiceId: data.invoiceId,
      title: data.title,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      categoryId: data.categoryId || null,
      status: "paid",
    })
    .returning()

  revalidatePath("/expenses")
  revalidatePath("/dashboard")
  return expense
}
