import { checkAdmin } from "@/lib/check-role"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, BookOpen, Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AdminContentPage() {
    await checkAdmin()

    const supabase = await createClient()

    // Get content counts
    const { count: testCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })

    const { count: unitCount } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })

    const { count: lessonCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })

    const { count: materialCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })

    // Get recent tests
    const { data: recentTests } = await supabase
        .from('tests')
        .select('*, units(title)')
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage all platform content
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{testCount || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{unitCount || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Lessons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lessonCount || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{materialCount || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/admin/content/units">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
                        <CardHeader>
                            <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                            <CardTitle>Manage Units</CardTitle>
                            <CardDescription>
                                Create and editing units
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="outline">
                                View Units
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/content/create-test">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary">
                        <CardHeader>
                            <FileText className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Create Test</CardTitle>
                            <CardDescription>
                                Build a new test or quiz
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                New Test
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/content/materials/upload">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
                        <CardHeader>
                            <Upload className="h-8 w-8 text-green-500 mb-2" />
                            <CardTitle>Upload Material</CardTitle>
                            <CardDescription>
                                Add PDFs, images, study guides
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Upload File
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/content/tests">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <FileText className="h-8 w-8 text-purple-500 mb-2" />
                            <CardTitle>All Tests</CardTitle>
                            <CardDescription>
                                View and manage all tests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="outline">
                                View Tests
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Tests</CardTitle>
                        <Link href="/admin/content/tests">
                            <Button variant="ghost" size="sm">View All</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {!recentTests || recentTests.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No tests created yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTests.map((test) => (
                                <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="font-medium">{test.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {test.units?.title} • Created {new Date(test.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge variant={test.is_published ? "default" : "secondary"}>
                                        {test.is_published ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
