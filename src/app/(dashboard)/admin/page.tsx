import { checkAdmin } from "@/lib/check-role"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, FileText, Settings, Plus } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
    await checkAdmin() // Restrict to admin only

    const supabase = await createClient()

    // Get counts
    const { count: teacherCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher')

    const { count: studentCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

    const { count: cohortCount } = await supabase
        .from('cohorts')
        .select('*', { count: 'exact', head: true })

    const { count: testCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })

    const { count: unitCount } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })

    const { count: materialCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your entire platform from here
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teacherCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Registered teachers
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                        <GraduationCap className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{studentCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total students
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Classes</CardTitle>
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cohortCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active classes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests</CardTitle>
                        <FileText className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{testCount || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Units</CardTitle>
                        <BookOpen className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{unitCount || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Materials</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{materialCount || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/admin/users">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <Users className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Manage Users</CardTitle>
                            <CardDescription>
                                Create teachers, view all users, manage roles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Go to User Management
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/content">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <BookOpen className="h-8 w-8 text-purple-500 mb-2" />
                            <CardTitle>Manage Content</CardTitle>
                            <CardDescription>
                                Create tests, units, lessons, upload materials
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Go to Content Management
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
