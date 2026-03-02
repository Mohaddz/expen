import { AppHeader } from "@/components/layout/app-header"
import { getCategories, seedDefaultCategories } from "@/actions/categories"
import { CategoryManager } from "@/components/settings/category-manager"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function SettingsPage() {
  await seedDefaultCategories()
  const categories = await getCategories()

  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage expense categories. These are used to organize your expenses and subscriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManager categories={categories} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OCR Settings</CardTitle>
              <CardDescription>
                Configure the Ollama endpoint for invoice OCR processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ollama endpoint is configured via environment variables.
                  Set <code className="text-xs bg-muted px-1 py-0.5 rounded">OLLAMA_BASE_URL</code> in
                  your <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> file.
                </p>
                <p className="text-xs text-muted-foreground">
                  Default: <code className="bg-muted px-1 py-0.5 rounded">http://localhost:11434</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
