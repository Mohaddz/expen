import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  decimal,
  date,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ── Better Auth tables ──────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ── Application tables ──────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6b7280"),
  icon: text("icon").default("circle"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  fileKey: text("file_key").notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name").notNull(),
  vendor: text("vendor"),
  ocrData: jsonb("ocr_data"),
  ocrStatus: text("ocr_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  date: date("date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: text("frequency").notNull().default("monthly"),
  startDate: date("start_date").notNull(),
  nextDueDate: date("next_due_date").notNull(),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  layout: jsonb("layout").notNull(),
  hiddenWidgets: jsonb("hidden_widgets").notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("SAR"),
  dateFormat: text("date_format").notNull().default("yyyy-MM-dd"),
  defaultCategoryId: uuid("default_category_id").references(
    () => categories.id,
    { onDelete: "set null" }
  ),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  weeklyReport: boolean("weekly_report").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const customSubscriptionServices = pgTable(
  "custom_subscription_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
)

// ── Relations ───────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many, one }) => ({
  expenses: many(expenses),
  categories: many(categories),
  invoices: many(invoices),
  subscriptions: many(subscriptions),
  dashboardLayout: one(dashboardLayouts),
  preferences: one(userPreferences),
  customServices: many(customSubscriptionServices),
}))

export const dashboardLayoutRelations = relations(dashboardLayouts, ({ one }) => ({
  user: one(user, { fields: [dashboardLayouts.userId], references: [user.id] }),
}))

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(user, { fields: [categories.userId], references: [user.id] }),
  expenses: many(expenses),
  subscriptions: many(subscriptions),
}))

export const expenseRelations = relations(expenses, ({ one }) => ({
  user: one(user, { fields: [expenses.userId], references: [user.id] }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  invoice: one(invoices, {
    fields: [expenses.invoiceId],
    references: [invoices.id],
  }),
}))

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  user: one(user, { fields: [invoices.userId], references: [user.id] }),
  expenses: many(expenses),
}))

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
}))

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
}))

export const customSubscriptionServicesRelations = relations(
  customSubscriptionServices,
  ({ one }) => ({
    user: one(user, {
      fields: [customSubscriptionServices.userId],
      references: [user.id],
    }),
  })
)
