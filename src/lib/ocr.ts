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
 * This is called once before the first inference request.
 */
let modelReady: Promise<void> | null = null

function ensureModel(): Promise<void> {
  if (modelReady) return modelReady

  modelReady = (async () => {
    try {
      // Check if model is already pulled
      const res = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: OCR_MODEL }),
      })

      if (res.ok) return

      // Model not found — pull it
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
      // Reset so next call retries
      modelReady = null
      throw error
    }
  })()

  return modelReady
}

export async function extractInvoiceData(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<OcrResult> {
  try {
    await ensureModel()

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OCR_MODEL,
        messages: [
          {
            role: "user",
            content: `Extract all invoice data from this image. Return ONLY valid JSON with this exact structure:
{
  "vendor": "company name",
  "date": "YYYY-MM-DD",
  "total": "123.45",
  "tax": "12.34",
  "currency": "USD",
  "lineItems": [
    {"description": "item name", "quantity": 1, "unitPrice": "10.00", "total": "10.00"}
  ]
}
If a field cannot be determined, use null. For lineItems, return an empty array if none found.`,
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
    const text = result.message?.content || ""

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { ...EMPTY_RESULT }

    return JSON.parse(jsonMatch[0]) as OcrResult
  } catch (error) {
    console.error("OCR extraction failed:", error)
    return { ...EMPTY_RESULT }
  }
}
