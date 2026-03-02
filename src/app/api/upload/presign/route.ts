import { auth } from "@/lib/auth"
import { getUploadPresignedUrl } from "@/lib/s3"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileName, contentType } = await request.json()

  const ext = fileName.split(".").pop() || "png"
  const key = `${session.user.id}/${randomUUID()}.${ext}`

  try {
    const url = await getUploadPresignedUrl(key, contentType)
    return NextResponse.json({ url, key })
  } catch (error) {
    console.error("Presign error:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
