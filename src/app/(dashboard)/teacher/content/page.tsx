import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, BarChart3, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function ContentManagementPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Check if user is a teacher
    const { data: teacherData } = await supabase
        .from('cohort_teachers')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

    if (!teacherData || teacherData.length === 0) {
        redirect('/student')
    }

    // Get teacher's courses
    const { data: cohorts } = await supabase
        .from('cohort_teachers')
        .select('cohorts(*, courses(id, title))')
        .eq('user_id', user.id)

    const courses = cohorts?.map((c: any) => c.cohorts?.courses || c.cohorts?.[0]?.courses).filter(Boolean) || []
    const uniqueCourses = Array.from(new Map(courses.map(c => [c.id, c])).values())

    // Count tests created by this teacher
    const { count: testCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

    // Count student attempts on tests created by this teacher
    // We use !inner to filter test_attempts by the related test's created_by field
    const { count: attemptCount } = await supabase
        .from('test_attempts')
        .select('id, tests!inner(created_by)', { count: 'exact', head: true })
        .eq('tests.created_by', user.id)

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Create tests, quizzes, and manage course materials
                    </p>
                </div>
                <Link href="/teacher/content/create-test">
                    <Button size="lg" className="gap-2">
                        <Plus className="h-5 w-5" />
                        Create Test
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests Created</CardTitle>
                        <FileText className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{testCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all your courses
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueCourses.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Teaching {uniqueCourses.map(c => c.title).join(', ')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Student Attempts</CardTitle>
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attemptCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total test attempts
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/teacher/content/tests">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <FileText className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>My Tests</CardTitle>
                            <CardDescription>
                                View and manage all your tests and quizzes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="secondary">{testCount || 0} tests</Badge>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/teacher/content/analytics">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <BarChart3 className="h-8 w-8 text-purple-500 mb-2" />
                            <CardTitle>Analytics</CardTitle>
                            <CardDescription>
                                View student performance and test statistics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="secondary">Coming soon</Badge>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Tests */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Tests</CardTitle>
                        <Link href="/teacher/content/tests">
                            <Button variant="ghost" size="sm">View All</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tests created yet</p>
                        <p className="text-sm mt-2">Create your first test to get started</p>
                        <Link href="/teacher/content/create-test">
                            <Button className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Test
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
