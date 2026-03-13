const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const OCR_MODEL = process.env.OCR_MODEL || "glm-ocr:q8_0"

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
 * Ensure the OCR model is available in Ollama, pulling it if necessary.
 */
let modelReady: Promise<void> | null = null

function ensureModel(): Promise<void> {
  if (modelReady) return modelReady

  modelReady = (async () => {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: OCR_MODEL }),
      })

      if (res.ok) return

      console.log(`Pulling OCR model ${OCR_MODEL}...`)
      const pullRes = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: OCR_MODEL, stream: false }),
      })

      if (!pullRes.ok) {
        throw new Error(
          `Failed to pull model ${OCR_MODEL}: ${pullRes.status}`
        )
      }
      console.log(`OCR model ${OCR_MODEL} ready.`)
    } catch (error) {
      modelReady = null
      throw error
    }
  })()

  return modelReady
}

/**
 * Call GLM-OCR with the correct prompt format.
 * GLM-OCR expects: "Text Recognition:" or "Table Recognition:" as the prompt.
 */
async function ocrExtract(
  imageBase64: string,
  mode: "Text Recognition:" | "Table Recognition:"
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OCR_MODEL,
      messages: [
        {
          role: "user",
          content: mode,
          images: [imageBase64],
        },
      ],
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`)
  }

  const result = await response.json()
  return result.message?.content || ""
}

/**
 * Parse raw OCR text into structured invoice data.
 */
function parseInvoiceText(raw: string): OcrResult {
  // Strip markdown fences if present
  const text = raw
    .replace(/```(?:markdown)?\n?/g, "")
    .replace(/```$/g, "")
    .trim()

  if (!text) return { ...EMPTY_RESULT }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()

    // Vendor: usually near the top, a company name line (Inc, LLC, Ltd, Corp, etc.)
    if (
      !vendor &&
      /\b(inc|llc|ltd|corp|company|co\.|gmbh|sarl)\b/i.test(line)
    ) {
      vendor = line.replace(/[,.]$/, "").trim()
    }

    // Date patterns
    if (!date) {
      // "Date of issue March 1, 2026" or "Date: 2026-03-01" etc.
      const dateLineMatch = line.match(
        /(?:date\s*(?:of\s*issue)?|invoice\s*date|issued?)\s*[:\s]*(.+)/i
      )
      if (dateLineMatch) {
        date = parseDate(dateLineMatch[1].trim())
      }
    }

    // Amount due / Total
    const amountDueMatch = line.match(
      /(?:amount\s*due|total\s*due|balance\s*due)[:\s]*[$€£]?\s*([\d,]+\.?\d*)/i
    )
    if (amountDueMatch) {
      total = amountDueMatch[1].replace(/,/g, "")
    }

    // "Total $52.97" pattern
    if (!total) {
      const totalMatch = line.match(
        /^total\s*[$€£]?\s*([\d,]+\.?\d*)/i
      )
      if (totalMatch) {
        total = totalMatch[1].replace(/,/g, "")
      }
    }

    // Subtotal (use as fallback if no total found)
    const subtotalMatch = line.match(
      /subtotal\s*[$€£]?\s*([\d,]+\.?\d*)/i
    )
    if (subtotalMatch && !total) {
      total = subtotalMatch[1].replace(/,/g, "")
    }

    // Tax
    const taxMatch = line.match(
      /(?:tax|vat|gst)\s*[$€£]?\s*([\d,]+\.?\d*)/i
    )
    if (taxMatch) {
      tax = taxMatch[1].replace(/,/g, "")
    }

    // Line items: "Description Qty Unit price Amount" table rows
    // Look for lines with a price at the end like "OpenRouter Credits 1 $52.97 $52.97"
    const itemMatch = line.match(
      /^(.+?)\s+(\d+)\s+[$€£]?([\d,]+\.?\d*)\s+[$€£]?([\d,]+\.?\d*)$/
    )
    if (itemMatch) {
      const desc = itemMatch[1].trim()
      // Skip header rows
      if (
        !/^(description|item|product|service)/i.test(desc) &&
        !/qty|quantity|unit\s*price|amount/i.test(desc)
      ) {
        lineItems.push({
          description: desc,
          quantity: parseInt(itemMatch[2]) || 1,
          unitPrice: itemMatch[3].replace(/,/g, ""),
          total: itemMatch[4].replace(/,/g, ""),
        })
      }
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
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<OcrResult> {
  try {
    await ensureModel()

    // Use both text and table recognition for best results
    const [textResult, tableResult] = await Promise.all([
      ocrExtract(imageBase64, "Text Recognition:"),
      ocrExtract(imageBase64, "Table Recognition:"),
    ])

    console.log("OCR Text Result:", textResult)
    console.log("OCR Table Result:", tableResult)

    // Combine both results - table recognition often captures line items better
    const combined = `${textResult}\n${tableResult}`
    return parseInvoiceText(combined)
  } catch (error) {
    console.error("OCR extraction failed:", error)
    return { ...EMPTY_RESULT }
  }
}
