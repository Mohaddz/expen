import { AppHeader } from "@/components/layout/app-header"
import { getCategories, seedDefaultCategories } from "@/actions/categories"
import { getUserPreferences } from "@/actions/settings"
import { getCustomServices } from "@/actions/custom-services"
import { SettingsLayout } from "@/components/settings/settings-layout"

export default async function SettingsPage() {
  await seedDefaultCategories()
  const [categories, preferences, customServices] = await Promise.all([
    getCategories(),
    getUserPreferences(),
    getCustomServices(),
  ])

  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          <SettingsLayout
            categories={categories}
            preferences={preferences}
            customServices={customServices}
          />
        </div>
      </div>
    </>
  )
}
