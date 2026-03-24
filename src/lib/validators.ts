import { z } from "zod"

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "Amount must be a positive number",
  }),
  currency: z.string().min(1),
  date: z.string().min(1, "Date is required"),
  categoryId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["pending", "paid", "overdue"]),
})

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "Amount must be a positive number",
  }),
  currency: z.string().min(1),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  categoryId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  active: z.boolean(),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1),
})

export const userPreferencesSchema = z.object({
  currency: z.enum(["SAR", "USD", "EUR", "GBP", "AED"]),
  dateFormat: z.enum(["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "dd-MM-yyyy"]),
  defaultCategoryId: z.string().uuid().optional().nullable(),
  emailNotifications: z.boolean(),
  weeklyReport: z.boolean(),
})

export const customServiceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
export type SubscriptionFormData = z.infer<typeof subscriptionSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>
export type CustomServiceFormData = z.infer<typeof customServiceSchema>
