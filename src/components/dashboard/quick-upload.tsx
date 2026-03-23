"use client"

import { useCallback, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { createInvoice, processInvoiceOcr, createExpenseFromInvoice } from "@/actions/upload"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Upload,
  FileImage,
  Loader2,
  Check,
} from "lucide-react"
import type { OcrResult } from "@/lib/ocr"

interface Category {
  id: string
  name: string
  color: string
}

type ProcessingState = "idle" | "processing" | "ready" | "saving"

export function QuickUpload({ categories }: { categories: Category[] }) {
  const [state, setState] = useState<ProcessingState>("idle")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    currency: "USD",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
  })
  const router = useRouter()

  const reset = () => {
    setState("idle")
    setPreview(null)
    setOcrResult(null)
    setInvoiceId(null)
    setFileName("")
    setFormData({
      title: "",
      amount: "",
      currency: "USD",
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
    })
  }

  const handleFile = async (f: File) => {
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      toast.error("Please upload an image or PDF")
      return
    }

    setFileName(f.name)
    setState("processing")

    if (f.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    }

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

      const arrayBuffer = await f.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")

      const result = await processInvoiceOcr(invoice.id, base64, f.type)
      setOcrResult(result)

      setFormData({
        title: result.vendor ? `Invoice from ${result.vendor}` : f.name,
        amount: result.total || "",
        currency: result.currency || "USD",
        date: result.date || new Date().toISOString().split("T")[0],
        categoryId: "",
      })

      setState("ready")
      setSheetOpen(true)
    } catch (error) {
      console.error("Upload/OCR failed:", error)
      toast.error("Processing failed. You can still enter details manually.")

      setFormData({
        title: f.name,
        amount: "",
        currency: "USD",
        date: new Date().toISOString().split("T")[0],
        categoryId: "",
      })

      setState("ready")
      setSheetOpen(true)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [])

  const handleSave = async () => {
    if (!formData.title || !formData.amount) {
      toast.error("Title and amount are required")
      return
    }

    setState("saving")
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
      setSheetOpen(false)
      reset()
      router.refresh()
    } catch {
      toast.error("Failed to save")
      setState("ready")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Upload</CardTitle>
        </CardHeader>
        <CardContent>
          {state === "idle" ? (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-muted-foreground/50 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
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
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-xs font-medium">Drop invoice here</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                or click to browse
              </p>
            </div>
          ) : state === "processing" ? (
            <div className="flex items-center gap-3 rounded-lg border border-muted p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{fileName}</p>
                <p className="text-[11px] text-muted-foreground">Processing with OCR...</p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 rounded-lg border border-muted p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSheetOpen(true)}
            >
              <Check className="h-5 w-5 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{fileName}</p>
                <p className="text-[11px] text-muted-foreground">Ready to review — click to open</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(open) => {
        setSheetOpen(open)
        if (!open && state === "ready") {
          // Keep state so user can re-open
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Review Invoice</SheetTitle>
            <SheetDescription>
              {ocrResult
                ? "OCR data extracted. Review and correct if needed."
                : "Enter the invoice details manually."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-4">
            {preview && (
              <div className="rounded-lg border overflow-hidden">
                <img
                  src={preview}
                  alt="Invoice preview"
                  className="w-full object-contain max-h-48"
                />
              </div>
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
              <Button onClick={handleSave} disabled={state === "saving"} className="flex-1">
                {state === "saving" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Expense
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSheetOpen(false)
                  reset()
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
