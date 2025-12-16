
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Trophy, Plus } from "lucide-react"
import Link from "next/link"

import { getUserStats } from "@/lib/student-stats"

export default async function StudentDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch enrolled classes
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, cohorts(id, name, courses(title))')
        .eq('user_id', user.id)

    const classes = enrollments?.map(e => e.cohorts) || []

    // Fetch real stats
    const stats = await getUserStats(user.id)

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back! Continue your SAT prep journey
                    </p>
                </div>
                <Link href="/student/join">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Join Class
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Classes</CardTitle>
                        <BookOpen className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classes.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Study Time</CardTitle>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.studyTimeHours}h</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Practice Score</CardTitle>
                        <Trophy className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageScore}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Classes */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">My Classes</h2>
                {classes.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No classes yet</h3>
                            <p className="text-muted-foreground text-center mb-4 max-w-sm">
                                Ask your teacher for a class code and join your first SAT prep class!
                            </p>
                            <Link href="/student/join">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Join Your First Class
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cohort: any) => (
                            <Link key={cohort.id} href={`/student/class/${cohort.id}`}>
                                <Card className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary">
                                    <CardHeader>
                                        <CardTitle className="group-hover:text-primary transition-colors">
                                            {cohort.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {cohort.courses?.title || 'SAT Prep'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">0%</span>
                                        </div>
                                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-0"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
