import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

export default async function StudentTestsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id: unitId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Get unit details
    const { data: unit } = await supabase
        .from('units')
        .select('*, courses(title)')
        .eq('id', unitId)
        .single()

    // Get published tests for this unit
    const { data: tests } = await supabase
        .from('tests')
        .select(`
            *,
            questions(count)
        `)
        .eq('unit_id', unitId)
        .eq('is_published', true)
        .order('created_at')

    // Get student's attempts
    const { data: attempts } = await supabase
        .from('test_attempts')
        .select('test_id, score, submitted_at')
        .eq('user_id', user.id)

    const attemptsByTest = attempts?.reduce((acc: any, attempt) => {
        if (!acc[attempt.test_id]) acc[attempt.test_id] = []
        acc[attempt.test_id].push(attempt)
        return acc
    }, {}) || {}

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{unit?.title} - Tests</h1>
                <p className="text-muted-foreground mt-1">
                    {unit?.courses?.title}
                </p>
            </div>

            {!tests || tests.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground">No tests available yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Your teacher will publish tests here soon
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tests.map((test) => {
                        const myAttempts = attemptsByTest[test.id] || []
                        const bestScore = myAttempts.length > 0
                            ? Math.max(...myAttempts.map((a: any) => a.score || 0))
                            : null
                        const attemptsLeft = test.max_attempts - myAttempts.length
                        const canAttempt = !test.max_attempts || attemptsLeft > 0

                        return (
                            <Card key={test.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle>{test.title}</CardTitle>
                                            <CardDescription className="mt-2">
                                                {test.description || "Test your knowledge"}
                                            </CardDescription>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    {test.questions?.length || 0} questions
                                                </span>
                                                {test.time_limit_minutes && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {test.time_limit_minutes} minutes
                                                    </span>
                                                )}
                                                <span>
                                                    Passing score: {test.passing_score}%
                                                </span>
                                            </div>
                                        </div>
                                        {bestScore !== null && (
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">
                                                    {bestScore}%
                                                </div>
                                                <Badge variant={bestScore >= test.passing_score ? "default" : "destructive"}>
                                                    {bestScore >= test.passing_score ? (
                                                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Passed</>
                                                    ) : (
                                                        <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                                                    )}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            {myAttempts.length > 0 ? (
                                                <>
                                                    {myAttempts.length} attempt{myAttempts.length > 1 ? 's' : ''}
                                                    {test.max_attempts && ` • ${attemptsLeft} remaining`}
                                                </>
                                            ) : (
                                                "Not attempted yet"
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {myAttempts.length > 0 && (
                                                <Link href={`/student/test/${test.id}/results`}>
                                                    <Button variant="outline" size="sm">
                                                        View Results
                                                    </Button>
                                                </Link>
                                            )}
                                            {canAttempt ? (
                                                <Link href={`/student/test/${test.id}/take`}>
                                                    <Button size="sm">
                                                        {myAttempts.length > 0 ? 'Retake Test' : 'Start Test'}
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button size="sm" disabled>
                                                    No Attempts Left
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
