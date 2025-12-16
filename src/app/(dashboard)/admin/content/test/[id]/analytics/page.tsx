import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, Users, Target, Clock } from "lucide-react"
import Link from "next/link"
import { checkAdmin } from "@/lib/check-role"

export default async function AdminTestAnalyticsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id: testId } = await params
    await checkAdmin()
    const supabase = await createClient()

    // Get test details
    const { data: test } = await supabase
        .from('tests')
        .select('*, units(title, courses(title))')
        .eq('id', testId)
        .single()

    if (!test) redirect('/admin/content/tests')

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

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/content/tests">
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
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{passRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {passedAttempts}/{totalAttempts} passed
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
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Attempts</CardTitle>
                        <Users className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts}</div>
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
                    </CardContent>
                </Card>
            </div>

            {/* Question Difficulty */}
            <Card>
                <CardHeader>
                    <CardTitle>Question Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {questionStats.map((q, index) => (
                            <div key={q.id} className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            Q{index + 1}: {q.question_text.substring(0, 80)}...
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            q.correctRate >= 70 ? "default" :
                                                q.correctRate >= 40 ? "secondary" :
                                                    "destructive"
                                        }
                                    >
                                        {q.correctRate}% correct
                                    </Badge>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${q.correctRate >= 70 ? 'bg-green-500' :
                                            q.correctRate >= 40 ? 'bg-orange-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${q.correctRate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
