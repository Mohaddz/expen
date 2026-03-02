const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"

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

export async function extractInvoiceData(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<OcrResult> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "glm-ocr",
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
    if (!jsonMatch) {
      return {
        vendor: null,
        date: null,
        total: null,
        tax: null,
        currency: null,
        lineItems: [],
      }
    }

    return JSON.parse(jsonMatch[0]) as OcrResult
  } catch (error) {
    console.error("OCR extraction failed:", error)
    return {
      vendor: null,
      date: null,
      total: null,
      tax: null,
      currency: null,
      lineItems: [],
    }
  }
}
