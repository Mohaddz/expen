"use client"

import { useState, useEffect, useRef } from "react"
import {
  UpdateNameCard,
  ChangeEmailCard,
} from "@daveyplate/better-auth-ui"
import { authClient } from "@/lib/auth-client"
import { updateUserImage } from "@/actions/settings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function resizeImage(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL("image/webp", 0.8))
    }
    img.src = dataUrl
  })
}

export function ProfileSection() {
  const [mounted, setMounted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (session?.user?.image) {
      setAvatarUrl(session.user.image)
    }
  }, [session?.user?.image])

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?"

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setUploading(true)
    try {
      // Convert to data URL and resize to 256px max
      const rawDataUrl = await fileToDataUrl(file)
      const resizedDataUrl = await resizeImage(rawDataUrl, 256)

      // Update in DB via server action
      await updateUserImage(resizedDataUrl)

      // Update local state immediately
      setAvatarUrl(resizedDataUrl)

      // Force Better Auth to refetch session (bypasses cookie cache)
      await authClient.getSession({ query: { disableCookieCache: true } })

      router.refresh()
      toast.success("Avatar updated")
    } catch (err) {
      console.error("Avatar upload error:", err)
      toast.error("Failed to upload avatar")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal information.
          </p>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border bg-card"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border bg-card p-6">
        <div className="relative group">
          <Avatar className="h-16 w-16 text-lg">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="flex-1">
          <p className="font-medium">{session?.user?.name}</p>
          <p className="text-sm text-muted-foreground">
            {session?.user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="mr-2 h-3.5 w-3.5" />
          )}
          Change
        </Button>
      </div>

      <UpdateNameCard />
      <ChangeEmailCard />
    </div>
  )
}
