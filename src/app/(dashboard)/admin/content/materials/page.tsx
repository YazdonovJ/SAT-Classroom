import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, FileText, Image as ImageIcon, File, Download, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { checkAdmin } from "@/lib/check-role"

export default async function AdminMaterialsLibraryPage() {
    await checkAdmin()
    const supabase = await createClient()

    // Fetch all materials
    const { data: materials } = await supabase
        .from('materials')
        .select(`
            *,
            units(title, courses(title)),
            lessons(title)
        `)
        .order('created_at', { ascending: false })

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'image': return <ImageIcon className="h-6 w-6 text-purple-500" />
            case 'pdf': return <FileText className="h-6 w-6 text-red-500" />
            default: return <File className="h-6 w-6 text-blue-500" />
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    }

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/content">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Material Library</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage all teaching materials (Admin)
                        </p>
                    </div>
                </div>
                <Link href="/admin/content/materials/upload">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Material
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
                        <File className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{materials?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">PDFs</CardTitle>
                        <FileText className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {materials?.filter(m => m.file_type === 'pdf').length || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Images</CardTitle>
                        <ImageIcon className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {materials?.filter(m => m.file_type === 'image').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Materials List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Materials</CardTitle>
                    <CardDescription>All loaded files</CardDescription>
                </CardHeader>
                <CardContent>
                    {!materials || materials.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No materials uploaded yet</p>
                            <Link href="/admin/content/materials/upload">
                                <Button className="mt-4">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Upload First Material
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {materials.map((material) => (
                                <Card key={material.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-3 flex-1">
                                                {getFileIcon(material.file_type)}
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-base truncate">
                                                        {material.title}
                                                    </CardTitle>
                                                    {material.description && (
                                                        <CardDescription className="text-xs mt-1 line-clamp-2">
                                                            {material.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            {material.units && (
                                                <p>📚 {material.units.courses?.title} • {material.units.title}</p>
                                            )}
                                            {material.lessons && (
                                                <p>📖 {material.lessons.title}</p>
                                            )}
                                            <p>💾 {formatFileSize(material.file_size)}</p>
                                            <p>📅 {new Date(material.created_at).toLocaleDateString()}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={material.file_url} target="_blank" className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                            <Button variant="outline" size="sm">
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-destructive">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
