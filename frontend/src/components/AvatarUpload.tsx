import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { logError } from '@/lib/errorHandler'

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange?: (newAvatar: string) => void
}

export function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload immediately
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const newAvatar = response.data.avatar
      
      if (onAvatarChange) {
        onAvatarChange(newAvatar)
      }
      
      toast.success('Avatar updated successfully!')
      setPreview(null)
    } catch (error) {
      logError('UploadAvatar', error)
      toast.error('Failed to upload avatar')
      setPreview(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (user?.is_anonymous) {
      toast.error('Anonymous users cannot delete avatar')
      return
    }

    try {
      await api.delete('/user/avatar')
      if (onAvatarChange) {
        const response = await api.get(`/user/profile`)
        onAvatarChange(response.data.user?.avatar || response.data.avatar)
      }
      toast.success('Avatar deleted')
    } catch (error) {
      logError('DeleteAvatar', error)
      toast.error('Failed to delete avatar')
    }
  }

  const displayAvatar = preview || currentAvatar

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Preview */}
      <div className="relative group">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
          
          {/* Avatar Image */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
            {isUploading ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Upload Overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <div className="flex flex-col items-center text-white">
              <Upload className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Change</span>
            </div>
          </button>
        </div>

        {/* Loading indicator */}
        {isUploading && (
          <div className="absolute -bottom-2 -right-2">
            <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="hover-lift"
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentAvatar?.includes('dicebear') ? 'Upload Photo' : 'Change Photo'}
        </Button>
        
        {currentAvatar && !currentAvatar.includes('dicebear') && !user?.is_anonymous && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive hover-lift"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG, GIF or WebP. Max 2MB.
        <br />
        Recommended: 200x200 to 800x800 pixels
      </p>
    </div>
  )
}