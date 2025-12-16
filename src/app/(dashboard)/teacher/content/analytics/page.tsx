
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { AnalyticsChart } from "@/components/teacher/analytics-chart"

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // 1. Get Teacher's Cohorts
    const { data: cohorts } = await supabase
        .from('cohort_teachers')
        .select('cohort_id')
        .eq('user_id', user.id)

    const cohortIds = cohorts?.map(c => c.cohort_id) || []

    if (cohortIds.length === 0) {
        return (
            <div className="min-h-screen bg-muted/20 p-8 flex flex-col items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Active Classes</h2>
                <p className="text-muted-foreground mb-6">You need to create a class and enroll students to see analytics.</p>
                <Link href="/teacher">
                    <Button>Go to Dashboard</Button>
                </Link>
            </div>
        )
    }

    // 2. Get Students in these Cohorts
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id')
        .in('cohort_id', cohortIds)

    const studentIds = enrollments?.map(e => e.user_id) || []

    if (studentIds.length === 0) {
        return (
            <div className="min-h-screen bg-muted/20 p-8 flex flex-col items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Students Found</h2>
                <p className="text-muted-foreground mb-6">Invite students to your classes to start tracking performance.</p>
                <Link href="/teacher">
                    <Button>Manage Classes</Button>
                </Link>
            </div>
        )
    }

    // 3. Fetch Attempts by these Students (on ANY test)
    const { data: attempts } = await supabase
        .from('test_attempts')
        .select(`
            score, 
            test_id,
            status,
            tests (id, title)
        `)
        .in('user_id', studentIds)
        .eq('status', 'completed')

    // 4. Process Data
    const totalAttempts = attempts?.length || 0

    // Average Score (Global for MY students)
    const averageScore = totalAttempts > 0
        ? Math.round(attempts!.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalAttempts)
        : 0

    // Group by Test Analysis
    // Map test_id -> { title, totalScore, count }
    const testStats = new Map<string, { title: string; total: number; count: number }>()

    attempts?.forEach(a => {
        // tests relation comes back as an object (single) or array depending on Supabase client generation
        // But with select 'tests(id, title)' it's usually an object if fkey is singular
        // Let's cast to any to be safe or check if array
        const testRelation = a.tests as any
        const testTitle = testRelation?.title || (Array.isArray(testRelation) ? testRelation[0]?.title : 'Unknown Test')

        const current = testStats.get(a.test_id) || { title: testTitle, total: 0, count: 0 }
        testStats.set(a.test_id, {
            title: testTitle,
            total: current.total + (a.score || 0),
            count: current.count + 1
        })
    })

    // Prepare Chart Data
    const chartData = Array.from(testStats.values()).map(stat => ({
        name: stat.title,
        avgScore: Math.round(stat.total / stat.count),
        attempts: stat.count
    }))

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/teacher/content">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Student performance overview
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Class Average</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageScore}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Average Score per Test</CardTitle>
                    <CardDescription>
                        Performance breakdown across your active tests
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {chartData.length > 0 ? (
                        <AnalyticsChart data={chartData} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No performance data yet
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
