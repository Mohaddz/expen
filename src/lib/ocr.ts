const HF_API_URL =
  process.env.HF_API_URL ||
  "https://router.huggingface.co/zai-org/api/paas/v4/layout_parsing"
const HF_TOKEN = process.env.HF_TOKEN || ""

export interface OcrResult {
  vendor: string | null
  date: string | null
  total: string | null
  tax: string | null
  currency: string | null
  lineItems: {
    description: string
    quantity: number
    unitPrice: string
    total: string
  }[]
}

const EMPTY_RESULT: OcrResult = {
  vendor: null,
  date: null,
  total: null,
  tax: null,
  currency: null,
  lineItems: [],
}

/**
 * Call HuggingFace GLM-OCR layout parsing API with a base64-encoded file.
 * The API expects JSON: { model: "glm-ocr", file: "data:<mime>;base64,<data>" }
 */
async function ocrExtract(base64Data: string, mimeType: string): Promise<string> {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN environment variable is required for OCR")
  }

  const dataUri = `data:${mimeType};base64,${base64Data}`

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-ocr",
      file: dataUri,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(
      `HuggingFace OCR request failed: ${response.status} ${errorText}`
    )
  }

  const result = await response.json()

  if (result.error) {
    throw new Error(`GLM-OCR error: ${result.error.message || JSON.stringify(result.error)}`)
  }

  // The layout_parsing API returns { md_results: "..." } with markdown text
  if (result.md_results) return result.md_results

  // Fallback: try other common fields
  if (typeof result === "string") return result
  if (result.text) return result.text
  if (result.content) return result.content

  return JSON.stringify(result)
}

/**
 * Parse raw OCR text into structured invoice data.
 */
function parseInvoiceText(raw: string): OcrResult {
  // Strip markdown fences if present
  const text = raw
    .replace(/```(?:markdown)?\n?/g, "")
    .replace(/```$/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove markdown images
    .trim()

  if (!text) return { ...EMPTY_RESULT }

  let vendor: string | null = null
  let date: string | null = null
  let total: string | null = null
  let tax: string | null = null
  let currency: string | null = null
  const lineItems: OcrResult["lineItems"] = []

  // Try to detect currency from text
  if (/\bUSD\b/.test(text)) currency = "USD"
  else if (/\bEUR\b/.test(text)) currency = "EUR"
  else if (/\bGBP\b/.test(text)) currency = "GBP"
  else if (/\bSAR\b/.test(text)) currency = "SAR"
  else if (/\bAED\b/.test(text)) currency = "AED"
  else if (/\$/.test(text)) currency = "USD"
  else if (/€/.test(text)) currency = "EUR"
  else if (/£/.test(text)) currency = "GBP"

  // Parse HTML table rows if present
  const tableMatch = text.match(/<table[^>]*>([\s\S]*?)<\/table>/i)
  if (tableMatch) {
    const rows = tableMatch[1].match(/<tr>([\s\S]*?)<\/tr>/gi) || []
    for (const row of rows) {
      const cells = (row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [])
        .map((c) => c.replace(/<[^>]*>/g, "").trim())
        .filter((c) => c.length > 0)

      if (cells.length === 0) continue

      // "Amount due" / "Total" rows in summary section (usually 2 cells)
      const label = cells[0].toLowerCase()
      const value = cells[cells.length - 1]

      if (/amount\s*due|total\s*due|balance\s*due/i.test(label)) {
        const m = value.match(/[$€£]?([\d,]+\.?\d*)/)
        if (m) total = m[1].replace(/,/g, "")
      } else if (/^total$/i.test(label) && !total) {
        const m = value.match(/[$€£]?([\d,]+\.?\d*)/)
        if (m) total = m[1].replace(/,/g, "")
      } else if (/^subtotal$/i.test(label) && !total) {
        const m = value.match(/[$€£]?([\d,]+\.?\d*)/)
        if (m) total = m[1].replace(/,/g, "")
      } else if (/tax|vat|gst/i.test(label)) {
        const m = value.match(/[$€£]?([\d,]+\.?\d*)/)
        if (m) tax = m[1].replace(/,/g, "")
      }

      // Line item rows (Description, Qty, Unit price, Amount — typically 4+ cells)
      if (cells.length >= 4) {
        const desc = cells[0]
        if (
          /^(description|item|product|service)/i.test(desc) ||
          /qty|quantity|unit\s*price|amount/i.test(desc)
        ) continue
        const qtyStr = cells.find((c) => /^\d+$/.test(c))
        const prices = cells.filter((c) => /^\$?[\d,]+\.?\d*$/.test(c.replace(/^\$/, "")))
        if (qtyStr && prices.length >= 1) {
          lineItems.push({
            description: desc,
            quantity: parseInt(qtyStr) || 1,
            unitPrice: prices[0].replace(/[$,]/g, ""),
            total: (prices[1] || prices[0]).replace(/[$,]/g, ""),
          })
        }
      }
    }
  }

  // Parse non-table lines for vendor, date, and fallback totals
  const plainText = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, "")
  const lines = plainText.split("\n").map((l) => l.replace(/^#+\s*/, "").trim()).filter(Boolean)

  for (const line of lines) {
    // Vendor: company name with Inc, LLC, Ltd, etc.
    if (
      !vendor &&
      /\b(inc|llc|ltd|corp|company|co\.|gmbh|sarl)\b/i.test(line)
    ) {
      vendor = line.replace(/[,.]$/, "").trim()
    }

    // Also try to pick up vendor from known patterns like "XYZ Purchase" or "XYZ EIN:"
    if (!vendor) {
      const einMatch = line.match(/^(.+?)\s+EIN:/i)
      if (einMatch) vendor = einMatch[1].trim()
      const purchaseMatch = line.match(/^(.+?)\s+Purchase$/i)
      if (purchaseMatch) vendor = purchaseMatch[1].trim()
    }

    // Date patterns
    if (!date) {
      const dateLineMatch = line.match(
        /(?:date\s*(?:of\s*issue)?|invoice\s*date|issued?)\s*[:\s]*(.+)/i
      )
      if (dateLineMatch) {
        date = parseDate(dateLineMatch[1].trim())
      }
    }

    // Fallback: amount from non-table text like "$52.97 USD due March 1, 2026"
    if (!total) {
      const amountDueMatch = line.match(
        /(?:amount\s*due|total\s*due|balance\s*due)[:\s]*[$€£]?\s*([\d,]+\.?\d*)/i
      )
      if (amountDueMatch) {
        total = amountDueMatch[1].replace(/,/g, "")
      }
    }
    if (!total) {
      const headerAmount = line.match(/^\$?([\d,]+\.?\d*)\s*(?:USD|EUR|GBP|SAR|AED)\b/i)
      if (headerAmount) {
        total = headerAmount[1].replace(/,/g, "")
      }
    }

    // Tax from text
    if (!tax) {
      const taxMatch = line.match(
        /(?:tax|vat|gst)\s*[$€£]?\s*([\d,]+\.?\d*)/i
      )
      if (taxMatch) tax = taxMatch[1].replace(/,/g, "")
    }
  }

  return { vendor, date, total, tax, currency, lineItems }
}

/**
 * Parse various date formats into YYYY-MM-DD.
 */
function parseDate(str: string): string | null {
  // "March 1, 2026" or "Mar 1, 2026"
  const monthNames: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09",
    oct: "10", nov: "11", dec: "12",
  }

  const namedMatch = str.match(
    /(\w+)\s+(\d{1,2}),?\s*(\d{4})/
  )
  if (namedMatch) {
    const month = monthNames[namedMatch[1].toLowerCase()]
    if (month) {
      const day = namedMatch[2].padStart(2, "0")
      return `${namedMatch[3]}-${month}-${day}`
    }
  }

  // "2026-03-01" already ISO
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return isoMatch[0]

  // "01/03/2026" or "1/3/2026"
  const slashMatch = str.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{4})/)
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[1].padStart(2, "0")}-${slashMatch[2].padStart(2, "0")}`
  }

  return null
}

export async function extractInvoiceData(
  base64Data: string,
  mimeType: string = "image/png"
): Promise<OcrResult> {
  try {
    const result = await ocrExtract(base64Data, mimeType)

    console.log("OCR Result:", result)

    return parseInvoiceText(result)
  } catch (error) {
    console.error("OCR extraction failed:", error)
    return { ...EMPTY_RESULT }
  }
}
