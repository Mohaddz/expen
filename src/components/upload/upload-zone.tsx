"use client"

import { useCallback, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createInvoice, processInvoiceOcr, createExpenseFromInvoice } from "@/actions/upload"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Upload,
  FileImage,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react"
import type { OcrResult } from "@/lib/ocr"

interface Category {
  id: string
  name: string
  color: string
}

type Step = "upload" | "processing" | "review" | "done" | "error"

/**
 * Render the first page of a PDF to a PNG image and return as base64.
 */
async function pdfToImageBase64(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  // Render at 2x scale for better OCR accuracy
  const scale = 2
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({
    canvasContext: canvas.getContext("2d")!,
    viewport,
    canvas,
  }).promise

  // Convert canvas to base64 PNG (strip the data:image/png;base64, prefix)
  const dataUrl = canvas.toDataURL("image/png")
  return dataUrl.split(",")[1]
}

export function UploadZone({ categories }: { categories: Category[] }) {
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    currency: "USD",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const dropped = e.dataTransfer.files[0]
      if (dropped) handleFile(dropped)
    },
    []
  )

  const handleFile = async (f: File) => {
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      toast.error("Please upload an image or PDF")
      return
    }

    setFile(f)

    if (f.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    }

    setStep("processing")

    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: f.name,
          contentType: f.type,
        }),
      })

      if (!presignRes.ok) throw new Error("Failed to get upload URL")

      const { url, key } = await presignRes.json()

      await fetch(url, {
        method: "PUT",
        body: f,
        headers: { "Content-Type": f.type },
      })

      const invoice = await createInvoice({
        fileKey: key,
        fileName: f.name,
      })
      setInvoiceId(invoice.id)

      // Convert file to a PNG image for OCR (PDFs need rendering first)
      let imageBase64: string
      let imageMime = "image/png"

      if (f.type === "application/pdf") {
        imageBase64 = await pdfToImageBase64(f)
      } else {
        const arrayBuffer = await f.arrayBuffer()
        imageBase64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        )
        imageMime = f.type
      }

      const result = await processInvoiceOcr(invoice.id, imageBase64, imageMime)
      setOcrResult(result)

      setFormData({
        title: result.vendor ? `Invoice from ${result.vendor}` : f.name,
        amount: result.total || "",
        currency: result.currency || "USD",
        date: result.date || new Date().toISOString().split("T")[0],
        categoryId: "",
      })

      setStep("review")
    } catch (error) {
      console.error("Upload/OCR failed:", error)
      setStep("error")
      toast.error("Processing failed. You can still enter details manually.")

      setFormData({
        title: f.name,
        amount: "",
        currency: "USD",
        date: new Date().toISOString().split("T")[0],
        categoryId: "",
      })
      setStep("review")
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.amount) {
      toast.error("Title and amount are required")
      return
    }

    setSaving(true)
    try {
      await createExpenseFromInvoice({
        invoiceId: invoiceId!,
        title: formData.title,
        amount: formData.amount,
        currency: formData.currency,
        date: formData.date,
        categoryId: formData.categoryId || null,
      })
      toast.success("Expense created from invoice")
      setStep("done")
      setTimeout(() => router.push("/expenses"), 1500)
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center transition-colors hover:border-muted-foreground/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">
            Drag & drop your invoice here
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Supports images (PNG, JPG) and PDF
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/*,.pdf"
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (f) handleFile(f)
              }
              input.click()
            }}
          >
            <FileImage className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm font-medium">Processing invoice...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Uploading and extracting data with OCR
          </p>
        </div>
      )}

      {step === "review" && (
        <div className="grid gap-6 md:grid-cols-2">
          {preview && (
            <Card>
              <CardContent className="p-4">
                <img
                  src={preview}
                  alt="Invoice preview"
                  className="w-full rounded-md object-contain max-h-96"
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Review Extracted Data</h3>

            {ocrResult && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3 text-green-500" />
                OCR data extracted. Review and correct if needed.
              </p>
            )}

            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) =>
                    setFormData({ ...formData, currency: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(v) =>
                  setFormData({ ...formData, categoryId: v })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {ocrResult?.lineItems && ocrResult.lineItems.length > 0 && (
              <div>
                <Label className="mb-2 block">Line Items</Label>
                <div className="rounded-md border divide-y text-xs">
                  {ocrResult.lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <span className="truncate flex-1">
                        {item.description}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        x{item.quantity}
                      </span>
                      <span className="font-mono ml-2">${item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Expense
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload")
                  setFile(null)
                  setPreview(null)
                  setOcrResult(null)
                }}
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center justify-center py-16">
          <Check className="h-8 w-8 text-green-500 mb-4" />
          <p className="text-sm font-medium">Expense saved!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Redirecting to expenses...
          </p>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <p className="text-sm font-medium">Processing failed</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setStep("upload")}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
