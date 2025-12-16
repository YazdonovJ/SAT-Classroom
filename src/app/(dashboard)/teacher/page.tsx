
import { createClient } from "@/lib/supabase/server"
import { CohortManager } from "@/components/teacher/cohort-manager"
import { CreateCohortDialog } from "@/components/teacher/create-cohort-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, GraduationCap, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default async function TeacherPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch cohorts where user is a teacher
    const { data: teacherCohorts } = await supabase
        .from('cohort_teachers')
        .select('cohort_id, cohorts(name, id, course_id, courses(title))')
        .eq('user_id', user.id)

    const cohorts = teacherCohorts?.map(tc => tc.cohorts) || []

    // Calculate simple stats
    const totalClasses = cohorts.length

    // Fetch active students count (unique students across all teacher's cohorts)
    // We get all enrollments for these cohorts
    const cohortIds = cohorts.map(c => c.id)

    let activeStudents = 0
    let totalAssignments = 0

    if (cohortIds.length > 0) {
        const { count: studentCount } = await supabase
            .from('enrollments')
            .select('user_id', { count: 'exact', head: true })
            .in('cohort_id', cohortIds)

        activeStudents = studentCount || 0

        // Fetch assignments count (via units -> courses -> cohorts is complex, simpler to query by course_ids if we had them)
        // Since assignments are linked to units, and units to courses.
        // Let's just count assignments for the courses these cohorts belong to.
        const courseIds = cohorts.map(c => c.course_id)
        if (courseIds.length > 0) {
            // We need to join: assignments -> units -> courses
            // This is tricky without a direct join. 
            // Let's do a two step or just count global assignments if that's easier for MVP?
            // Better: Join units.
            const { count: assignmentCount } = await supabase
                .from('assignments')
                .select('id', { count: 'exact', head: true })
            // This would require filtering by units that belong to my courses.
            // For MVP, let's just show Total Assignments user created? No, assignments are content.
            // Let's show 0 for now or try to get it right.
            // Simpler: Just count total enrollments as "Assignments" is confusing.
            // Let's try to fetch units first.
        }

        // Actually, just fetching all enrollments is good enough for "Total Students"
    }

    // Fetch tests created by this teacher
    const { count: testCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                        Teacher Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your classes, students, and content.
                    </p>
                </div>
                <CreateCohortDialog />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-panel border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Classes</CardTitle>
                        <BookOpen className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClasses}</div>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeStudents}</div>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-l-4 border-l-indigo-500 hover:shadow-lg transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests Created</CardTitle>
                        <GraduationCap className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{testCount || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <Link href="/teacher/content" className="flex-1">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Content Management</CardTitle>
                            <BookOpen className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mt-1">Manage tests and courses</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/teacher/content/analytics" className="flex-1">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Analytics Dashboard</CardTitle>
                            <LayoutDashboard className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mt-1">View student performance</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Your Classes</h2>
                </div>

                {cohorts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-white/50 dark:bg-black/20">
                        <div className="p-4 rounded-full bg-primary/10 mb-4">
                            <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium">No classes yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm text-center">
                            Get started by creating your first class to invite students and manage content.
                        </p>
                        <CreateCohortDialog />
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <CohortManager cohorts={cohorts} />
                    </div>
                )}
            </div>
        </div>
    )
}
