'use client'

import React from "react"

import { useState, useRef } from 'react'
import { useOnboardingStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Camera, 
  Video, 
  Upload, 
  X, 
  ImageIcon,
  Film,
  Plus,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Eye,
  Building2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  name: string
  description?: string
  uploadedAt: string
}

interface StoreLogo {
  id: string
  url: string
  name: string
  uploadedAt: string
}

export function StorePhotosStep() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboardingStore()
  const [dragActive, setDragActive] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  
  const mediaItems = formData.storeMedia || []
  const storeLogo = formData.storeLogo

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Max file size: 500MB for Vercel Blob Pro/Enterprise plans
  // Note: Free tier is limited to 4.5MB - upgrade your Vercel plan if needed
  const MAX_FILE_SIZE = 500 * 1024 * 1024
  
  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    
    setIsUploading(true)
    setUploadError(null)
    const newItems: MediaItem[] = []
    const failedFiles: string[] = []
    
    for (const file of Array.from(files)) {
      // Check by MIME type first, then fall back to extension for video files
      const videoExtensions = ['.mov', '.mp4', '.avi', '.mkv', '.wmv', '.flv', '.mts', '.m2ts', '.webm', '.ogv', '.3gp']
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      const isVideo = file.type.startsWith('video/') || videoExtensions.includes(fileExt)
      const isImage = file.type.startsWith('image/')
      
      if (!isVideo && !isImage) continue
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        failedFiles.push(`${file.name} (too large - max 500MB)`)
        continue
      }
      
      try {
        // Generate unique filename
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `uploads/media/${timestamp}-${safeName}`
        
        // Upload directly to Supabase Storage (bypass API route for large files)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey) {
          failedFiles.push(`${file.name} (storage not configured)`)
          continue
        }
        
        const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${filename}`
        const arrayBuffer = await file.arrayBuffer()
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true',
          },
          body: arrayBuffer,
        })
        
        if (response.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${filename}`
          newItems.push({
            id: crypto.randomUUID(),
            type: isVideo ? 'video' : 'image',
            url: publicUrl,
            name: file.name,
            uploadedAt: new Date().toISOString(),
          })
        } else {
          const errorText = await response.text()
          failedFiles.push(`${file.name} (${errorText || 'upload failed'})`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'network error'
        failedFiles.push(`${file.name} (${errorMsg})`)
      }
    }
    
    if (newItems.length > 0) {
      updateFormData({
        storeMedia: [...mediaItems, ...newItems]
      })
    }
    
    if (failedFiles.length > 0) {
      setUploadError(`Failed to upload: ${failedFiles.join(', ')}`)
    }
    
    setIsUploading(false)
  }

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  
  const handleLogoFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    
    setIsUploadingLogo(true)
    try {
      // Upload directly to Supabase Storage (same as media files)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Storage not configured')
        setIsUploadingLogo(false)
        return
      }
      
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `uploads/logos/${timestamp}-${safeName}`
      
      const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${filename}`
      const arrayBuffer = await file.arrayBuffer()
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': file.type || 'image/png',
          'x-upsert': 'true',
        },
        body: arrayBuffer,
      })
      
      if (response.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${filename}`
        updateFormData({
          storeLogo: {
            id: crypto.randomUUID(),
            url: publicUrl,
            name: file.name,
            uploadedAt: new Date().toISOString(),
          }
        })
      } else {
        const errorText = await response.text()
        console.error('Logo upload failed:', errorText)
      }
    } catch (error) {
      console.error('Logo upload error:', error)
    }
    setIsUploadingLogo(false)
  }

  const removeLogo = () => {
    updateFormData({ storeLogo: undefined })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeItem = (id: string) => {
    updateFormData({
      storeMedia: mediaItems.filter(item => item.id !== id)
    })
  }

  const updateItemDescription = (id: string, description: string) => {
    updateFormData({
      storeMedia: mediaItems.map(item => 
        item.id === id ? { ...item, description } : item
      )
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-lb-cyan/20 to-lb-blue/20 flex items-center justify-center">
            <Camera className="h-5 w-5 text-lb-blue" />
          </div>
          <div>
            <CardTitle>Store Photos & Videos</CardTitle>
            <CardDescription>Help us understand your laundromat layout</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Logo Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-lb-blue" />
              <Label className="text-base font-medium">Store Logo</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload your store logo to be displayed on your customer portal and admin dashboard.
            </p>
            
            {storeLogo ? (
              <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-muted/30">
                <div className="h-20 w-20 rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center">
                  <img 
                    src={storeLogo.url || "/placeholder.svg"} 
                    alt="Store Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{storeLogo.name}</p>
                  <p className="text-xs text-muted-foreground">Uploaded {new Date(storeLogo.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeLogo}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 hover:border-lb-cyan hover:bg-muted/50 transition-all cursor-pointer"
                onClick={() => logoInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-lb-cyan/20 to-lb-blue/20 flex items-center justify-center mb-3">
                    <Building2 className="h-6 w-6 text-lb-blue" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click to upload your store logo</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or SVG (recommended: 200x200px or larger)</p>
                </div>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoFile(e.target.files)}
            />
          </div>

          <div className="border-t border-border" />

          {/* Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
              ${dragActive 
                ? 'border-lb-blue bg-lb-blue/5 scale-[1.02]' 
                : 'border-border hover:border-lb-cyan hover:bg-muted/50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.mov,.mp4,.avi,.mkv,.wmv,.flv,.mts,.m2ts"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-lb-cyan/20 to-lb-blue/20 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-lb-blue" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Drop your files here
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse. Supports images and videos.
              </p>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Add Photos
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Film className="h-4 w-4" />
                  Add Videos
                </Button>
              </div>
            </div>
          </div>
          
          {/* Upload Error Message */}
          {uploadError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
              {uploadError}
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Recommended photos to include:</h4>
            <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lb-cyan" />
                <span>Storefront / exterior view</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lb-cyan" />
                <span>Main floor layout</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lb-cyan" />
                <span>Washer and dryer rows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lb-cyan" />
                <span>Current payment area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lb-cyan" />
                <span>Utility room / back area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-lb-cyan" />
                <span>Any problem areas</span>
              </div>
            </div>
          </div>

          {/* Media Grid */}
          {mediaItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  Uploaded Media ({mediaItems.length})
                </h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mediaItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="group relative bg-muted rounded-lg overflow-hidden border border-border"
                  >
                    {/* Preview */}
                    <div className="aspect-video relative bg-black/5">
                      {item.type === 'image' ? (
                        <img 
                          src={item.url || "/placeholder.svg"} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.log('[v0] Image failed to load:', item.url)
                            e.currentTarget.src = '/placeholder.svg'
                          }}
                        />
                      ) : (
                        <video 
                          src={item.url}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          {item.type === 'video' ? (
                            <Video className="h-3 w-3" />
                          ) : (
                            <ImageIcon className="h-3 w-3" />
                          )}
                          {item.type}
                        </div>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="p-3">
                      <p className="text-sm font-medium text-foreground truncate mb-2">
                        {item.name}
                      </p>
                      <Textarea
                        placeholder="Add a description (optional)"
                        value={item.description || ''}
                        onChange={(e) => updateItemDescription(item.id, e.target.value)}
                        className="text-xs min-h-[60px] resize-none"
                      />
                    </div>
                  </div>
                ))}
                
                {/* Add More Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg hover:border-lb-cyan hover:bg-muted/50 transition-all"
                >
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Add More</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewItem?.type === 'image' ? (
              <img 
                src={previewItem.url || "/placeholder.svg"} 
                alt={previewItem.name}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            ) : previewItem?.type === 'video' ? (
              <video 
                src={previewItem.url}
                controls
                className="w-full h-auto max-h-[70vh] rounded-lg"
              />
            ) : null}
            {previewItem?.description && (
              <p className="mt-4 text-sm text-muted-foreground">
                {previewItem.description}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
