import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Users, Target, Clock } from "lucide-react"
import Link from "next/link"

export default async function TestAnalyticsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id: testId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Get test details
    const { data: test } = await supabase
        .from('tests')
        .select('*, units(title, courses(title))')
        .eq('id', testId)
        .single()

    if (!test) redirect('/teacher/content')

    // Get questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('order_index')

    // Get all attempts for this test
    const { data: attempts } = await supabase
        .from('test_attempts')
        .select('*, users(full_name, email)')
        .eq('test_id', testId)
        .order('submitted_at', { ascending: false })

    // Calculate statistics
    const totalAttempts = attempts?.length || 0
    const uniqueStudents = new Set(attempts?.map(a => a.user_id)).size

    const scores = attempts?.map(a => a.score).filter(Boolean) || []
    const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0

    const passedAttempts = attempts?.filter(a => a.score >= test.passing_score).length || 0
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0

    const avgTime = (attempts?.length || 0) > 0
        ? Math.round(attempts!.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / attempts!.length)
        : 0

    // Question difficulty analysis
    const questionStats = questions?.map(q => {
        const correctCount = attempts?.filter(a =>
            a.answers[q.id] === q.correct_answer
        ).length || 0

        const totalAnswered = attempts?.filter(a => a.answers[q.id]).length || 0
        const correctRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0

        return {
            ...q,
            correctCount,
            totalAnswered,
            correctRate
        }
    }) || []

    // Student performance
    const studentPerformance = attempts?.reduce((acc: any[], attempt) => {
        const existing = acc.find(s => s.user_id === attempt.user_id)
        if (!existing) {
            acc.push({
                user_id: attempt.user_id,
                name: attempt.users?.full_name || 'Unknown',
                email: attempt.users?.email,
                attempts: [attempt],
                bestScore: attempt.score,
                latestAttempt: attempt.submitted_at
            })
        } else {
            existing.attempts.push(attempt)
            existing.bestScore = Math.max(existing.bestScore, attempt.score || 0)
            if (new Date(attempt.submitted_at) > new Date(existing.latestAttempt)) {
                existing.latestAttempt = attempt.submitted_at
            }
        }
        return acc
    }, []) || []

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/teacher/content/tests">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{test.title} - Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        {test.units?.courses?.title} • {test.units?.title}
                    </p>
                </div>
                <Badge variant={test.is_published ? "default" : "secondary"}>
                    {test.is_published ? "Published" : "Draft"}
                </Badge>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
                        <Target className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgScore}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Passing: {test.passing_score}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
                        {passRate >= 70 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{passRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {passedAttempts} of {totalAttempts} passed
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueStudents}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unique students
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
                        <Users className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All submissions
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.floor(avgTime / 60)}:{(avgTime % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Minutes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Question Difficulty */}
            <Card>
                <CardHeader>
                    <CardTitle>Question Difficulty Analysis</CardTitle>
                    <CardDescription>
                        How students performed on each question
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {questionStats.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No data yet</p>
                    ) : (
                        <div className="space-y-4">
                            {questionStats.map((q, index) => (
                                <div key={q.id} className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                Question {index + 1}: {q.question_text.substring(0, 80)}
                                                {q.question_text.length > 80 && '...'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Correct Answer: {q.correct_answer}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                variant={
                                                    q.correctRate >= 70 ? "default" :
                                                        q.correctRate >= 40 ? "secondary" :
                                                            "destructive"
                                                }
                                            >
                                                {q.correctRate}% correct
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {q.correctCount}/{q.totalAnswered} students
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${q.correctRate >= 70 ? 'bg-primary' :
                                                q.correctRate >= 40 ? 'bg-orange-500' :
                                                    'bg-destructive'
                                                }`}
                                            style={{ width: `${q.correctRate}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Student Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Student Performance</CardTitle>
                    <CardDescription>
                        Individual student scores and attempts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {studentPerformance.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No students have taken this test yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {studentPerformance
                                .sort((a, b) => b.bestScore - a.bestScore)
                                .map((student) => (
                                    <div
                                        key={student.user_id}
                                        className="flex items-center justify-between p-4 rounded-lg border bg-background"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{student.name}</p>
                                            <p className="text-sm text-muted-foreground">{student.email}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">
                                                    {student.attempts.length} attempt{student.attempts.length > 1 ? 's' : ''}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Latest: {new Date(student.latestAttempt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">
                                                    {student.bestScore}%
                                                </div>
                                                <Badge
                                                    variant={student.bestScore >= test.passing_score ? "default" : "destructive"}
                                                    className="mt-1"
                                                >
                                                    {student.bestScore >= test.passing_score ? "Passed" : "Failed"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
