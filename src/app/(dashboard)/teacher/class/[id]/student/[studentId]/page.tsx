import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Trophy, Calendar } from "lucide-react"
import Link from "next/link"

export default async function StudentAnalyticsPage({
    params
}: {
    params: Promise<{ id: string; studentId: string }>
}) {
    const { id: cohortId, studentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch student details
    const { data: student } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single()

    // Fetch cohort details
    const { data: cohort } = await supabase
        .from('cohorts')
        .select('*, courses(id, title)')
        .eq('id', cohortId)
        .single()

    // Fetch course units
    const { data: units } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', cohort?.course_id)
        .order('order_index')

    // Fetch unit states for this cohort
    const { data: unitStates } = await supabase
        .from('cohort_unit_state')
        .select('*')
        .eq('cohort_id', cohortId)

    // Fetch test attempts for this student in this cohort
    const { data: testAttempts } = await supabase
        .from('test_attempts')
        .select('*, tests(title, unit_id)')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })

    const unlockedUnits = unitStates?.filter(s => s.is_unlocked) || []
    const totalUnits = units?.length || 0
    const unlockedCount = unlockedUnits.length

    // Calculate stats
    const totalAttempts = testAttempts?.length || 0

    // Group attempts by test
    const testsMap = new Map()
    testAttempts?.forEach(attempt => {
        if (!testsMap.has(attempt.test_id)) {
            testsMap.set(attempt.test_id, {
                title: attempt.tests?.title || 'Untitled Test',
                unitId: attempt.tests?.unit_id,
                attempts: [],
                bestScore: 0,
                totalTime: 0
            })
        }
        const test = testsMap.get(attempt.test_id)
        test.attempts.push(attempt)
        test.bestScore = Math.max(test.bestScore, attempt.score)
        test.totalTime += attempt.time_spent_seconds
    })

    const uniqueTests = Array.from(testsMap.values())
    const avgScore = totalAttempts > 0
        ? Math.round(testAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalAttempts)
        : 0
    const totalTimeSeconds = testAttempts?.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0) || 0
    const totalTimeHours = Math.round(totalTimeSeconds / 3600 * 10) / 10

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/teacher/class/${cohortId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{student?.full_name || 'Student'}</h1>
                    <p className="text-muted-foreground mt-1">
                        {cohort?.name} • {cohort?.courses?.title}
                    </p>
                </div>
                <Badge variant="secondary">Active</Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Course Progress</CardTitle>
                        <Trophy className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalUnits > 0 ? Math.round((unlockedCount / totalUnits) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {unlockedCount} of {totalUnits} units unlocked
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 ${avgScore >= 70 ? 'border-l-green-500' : 'border-l-orange-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                        <CheckCircle2 className={`h-4 w-4 ${avgScore >= 70 ? 'text-green-500' : 'text-orange-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgScore}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all attempts
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Time</CardTitle>
                        <Clock className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTimeHours}h</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Time spent on tests
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests Taken</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueTests.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalAttempts} total attempts
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Course Content & Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Course Content & Performance</CardTitle>
                    <CardDescription>
                        Track progress and test results by unit
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!units || units.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No units available</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {units.map((unit, index) => {
                                const isUnlocked = unitStates?.find(s => s.unit_id === unit.id && s.is_unlocked)
                                const unitTests = uniqueTests.filter((t: any) => t.unitId === unit.id)

                                return (
                                    <div key={unit.id} className="space-y-3">
                                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{unit.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isUnlocked ? 'Available to student' : 'Locked by teacher'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={isUnlocked ? "default" : "secondary"}>
                                                {isUnlocked ? "Unlocked" : "Locked"}
                                            </Badge>
                                        </div>

                                        {/* Render Tests for this Unit */}
                                        {unitTests.length > 0 && (
                                            <div className="pl-6 space-y-2">
                                                {unitTests.map((test: any, tIndex: number) => {
                                                    const avgTestScore = Math.round(test.attempts.reduce((acc: any, curr: any) => acc + curr.score, 0) / test.attempts.length)
                                                    const avgAccTime = Math.round((test.totalTime / test.attempts.length) / 60)
                                                    const lastAttempt = test.attempts[0]

                                                    return (
                                                        <div key={tIndex} className="flex items-center justify-between p-4 rounded-lg border bg-background ml-4 border-l-4 border-l-blue-500">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-2 rounded-full ${test.bestScore >= 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                    <Trophy className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">{test.title}</p>
                                                                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                                        <span className="font-medium text-foreground">{student?.full_name}</span>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" /> {avgAccTime}m avg
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3" /> Last: {new Date(lastAttempt.created_at).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4 text-sm">
                                                                <div className="text-right">
                                                                    <p className="font-bold">{test.attempts.length}</p>
                                                                    <p className="text-xs text-muted-foreground">Attempts</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold">{test.bestScore}%</p>
                                                                    <p className="text-xs text-muted-foreground">Best</p>
                                                                </div>
                                                                <Badge variant={avgTestScore >= 70 ? "default" : "secondary"}>
                                                                    Avg {avgTestScore}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
