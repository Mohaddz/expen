import { AppHeader } from "@/components/layout/app-header"
import { UploadZone } from "@/components/upload/upload-zone"
import { getCategories, seedDefaultCategories } from "@/actions/categories"

export default async function UploadPage() {
  await seedDefaultCategories()
  const categories = await getCategories()

  return (
    <>
      <AppHeader title="Upload Invoice" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Invoice Scanner</h2>
            <p className="text-sm text-muted-foreground">
              Upload an invoice image or PDF. The OCR will extract vendor, amount, date and line items automatically.
            </p>
          </div>
          <UploadZone categories={categories} />
        </div>
      </div>
    </>
  )
}
