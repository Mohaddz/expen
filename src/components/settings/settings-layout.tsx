"use client"

import { useQueryState } from "nuqs"
import { cn } from "@/lib/utils"
import {
  User,
  SlidersHorizontal,
  FolderOpen,
  Shield,
  Bell,
  Tv,
  Database,
} from "lucide-react"
import { ProfileSection } from "./profile-section"
import { PreferencesSection } from "./preferences-section"
import { CategoryManager } from "./category-manager"
import { SecuritySection } from "./security-section"
import { NotificationsSection } from "./notifications-section"
import { CustomServicesSection } from "./custom-services-section"
import { DataSection } from "./data-section"

interface Category {
  id: string
  name: string
  color: string
  icon: string | null
}

interface CustomService {
  id: string
  name: string
}

interface UserPrefs {
  currency: string
  dateFormat: string
  defaultCategoryId: string | null
  emailNotifications: boolean
  weeklyReport: boolean
}

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "categories", label: "Categories", icon: FolderOpen },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "services", label: "Subscription Services", icon: Tv },
  { id: "data", label: "Data & Account", icon: Database },
] as const

export function SettingsLayout({
  categories,
  preferences,
  customServices,
}: {
  categories: Category[]
  preferences: UserPrefs
  customServices: CustomService[]
}) {
  const [section, setSection] = useQueryState("section", {
    defaultValue: "profile",
  })

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar nav */}
      <nav className="flex lg:w-56 lg:flex-col lg:shrink-0">
        <div className="flex w-full gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  section === s.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {section === "profile" && <ProfileSection />}
        {section === "preferences" && (
          <PreferencesSection
            preferences={preferences}
            categories={categories}
          />
        )}
        {section === "categories" && (
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Categories</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Manage expense categories used to organize your expenses and
              subscriptions.
            </p>
            <CategoryManager categories={categories} />
          </div>
        )}
        {section === "security" && <SecuritySection />}
        {section === "notifications" && (
          <NotificationsSection preferences={preferences} />
        )}
        {section === "services" && (
          <CustomServicesSection services={customServices} />
        )}
        {section === "data" && <DataSection />}
      </div>
    </div>
  )
}
