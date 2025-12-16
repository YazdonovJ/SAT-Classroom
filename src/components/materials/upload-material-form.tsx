"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, FileText, Image as ImageIcon, File } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UploadMaterialFormProps {
    units: any[]
    lessons: any[]
    redirectPath?: string
}

export function UploadMaterialForm({ units, lessons, redirectPath = '/teacher/content/materials' }: UploadMaterialFormProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedUnit, setSelectedUnit] = useState("")
    const [selectedLesson, setSelectedLesson] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-purple-500" />
        if (type === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />
        return <File className="h-8 w-8 text-blue-500" />
    }

    const getFileType = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return 'image'
        if (mimeType === 'application/pdf') return 'pdf'
        if (mimeType.includes('video')) return 'video'
        return 'other'
    }

    const handleUpload = async () => {
        if (!title || !file) {
            toast.error("Please fill in all required fields")
            return
        }

        if (!selectedUnit && !selectedLesson) {
            toast.error("Please select a unit or lesson")
            return
        }

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('course-materials')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('course-materials')
                .getPublicUrl(filePath)

            // Save material metadata to database
            const { error: dbError } = await supabase
                .from('materials')
                .insert({
                    title,
                    description,
                    unit_id: selectedUnit || null,
                    lesson_id: selectedLesson || null,
                    file_url: publicUrl,
                    file_type: getFileType(file.type),
                    file_size: file.size,
                    uploaded_by: user.id
                })

            if (dbError) throw dbError

            toast.success("Material uploaded successfully!")
            router.push(redirectPath)
        } catch (error: any) {
            toast.error("Failed to upload material", {
                description: error.message
            })
        } finally {
            setUploading(false)
        }
    }

    const filteredLessons = selectedUnit
        ? lessons.filter((l: any) => l.unit_id === selectedUnit)
        : lessons

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>
                        Upload PDFs, images, or other learning materials
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* File Upload Area */}
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center gap-4">
                                    {getFileIcon(file.type)}
                                    <div className="text-left">
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setFile(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                                <div>
                                    <p className="text-lg font-medium">
                                        Drag and drop your file here
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        or click to browse
                                    </p>
                                </div>
                                <Input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                                />
                                <Label htmlFor="file-upload">
                                    <Button asChild variant="outline">
                                        <span>Choose File</span>
                                    </Button>
                                </Label>
                            </div>
                        )}
                    </div>

                    {/* Material Details */}
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Algebra Formulas Cheat Sheet"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what this material contains..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Attach to Unit</Label>
                                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select unit (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id}>
                                                {unit.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="lesson">Attach to Lesson</Label>
                                <Select
                                    value={selectedLesson}
                                    onValueChange={setSelectedLesson}
                                    disabled={!selectedUnit}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select lesson (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredLessons.map((lesson: any) => (
                                            <SelectItem key={lesson.id} value={lesson.id}>
                                                {lesson.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading || !file}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Material"}
                </Button>
            </div>
        </div>
    )
}
