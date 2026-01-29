'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Loader2, ImageIcon, AlertCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { uploadApi, protocolsApi, ProtocolFile, getFileUrl } from '@/lib/api'

interface ProtocolPhotoUploadProps {
  fileType: 'before' | 'after'
  files: ProtocolFile[]
  onFilesChange: (files: ProtocolFile[]) => void
  label?: string
  maxFiles?: number
  disabled?: boolean
}

export function ProtocolPhotoUpload({
  fileType,
  files,
  onFilesChange,
  label,
  maxFiles = 10,
  disabled = false,
}: ProtocolPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const remainingSlots = maxFiles - files.length
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    const filesToUpload = Array.from(selectedFiles).slice(0, remainingSlots)

    // Validate files
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
    }

    setError(null)
    setUploading(true)

    try {
      const uploadedFiles: ProtocolFile[] = []

      for (const file of filesToUpload) {
        const uploaded = await uploadApi.uploadProtocolPhoto(file, fileType)
        uploadedFiles.push(uploaded)
      }

      onFilesChange([...files, ...uploadedFiles])
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }, [files, fileType, maxFiles, onFilesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }, [disabled, handleFiles])

  const handleDelete = useCallback(async (fileId: number) => {
    try {
      await protocolsApi.deleteUnattachedFile(fileId)
      onFilesChange(files.filter(f => f.id !== fileId))
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete file')
    }
  }, [files, onFilesChange])

  const handleTogglePortfolio = useCallback(async (fileId: number, currentValue: boolean) => {
    try {
      const updated = await protocolsApi.updateFile(fileId, { show_in_portfolio: !currentValue })
      onFilesChange(files.map(f => f.id === fileId ? updated : f))
    } catch (err) {
      console.error('Toggle portfolio error:', err)
      setError('Failed to update file')
    }
  }, [files, onFilesChange])

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}

      {/* Drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, GIF, WebP up to 5MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {files.map((file) => (
            <div key={file.id} className="space-y-1">
              <div className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFileUrl(file.file_path)}
                  alt={file.original_filename}
                  className="w-full h-full object-cover"
                />
                {/* Delete button on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(file.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Portfolio checkbox - always visible */}
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <Checkbox
                  checked={file.show_in_portfolio}
                  onCheckedChange={() => handleTogglePortfolio(file.id, file.show_in_portfolio)}
                  className="h-3.5 w-3.5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <span className={file.show_in_portfolio ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                  Портфоліо
                </span>
                {file.show_in_portfolio && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
              </label>
            </div>
          ))}

          {/* Empty slots */}
          {files.length < maxFiles && (
            <div className="space-y-1">
              <div
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={handleClick}
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="h-5" /> {/* Spacer to match checkbox height */}
            </div>
          )}
        </div>
      )}

      {/* File count */}
      <p className="text-xs text-muted-foreground">
        {files.length} / {maxFiles} files
      </p>
    </div>
  )
}
