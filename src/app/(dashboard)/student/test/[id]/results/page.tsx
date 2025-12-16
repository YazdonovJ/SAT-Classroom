"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ArrowRight, Home } from "lucide-react"

export default function TestResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const [attempt, setAttempt] = useState<any>(null)
    const [test, setTest] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const attemptId = searchParams.get('attempt')
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            if (!attemptId) return

            try {
                // Fetch attempt
                const { data: attemptData, error: attemptError } = await supabase
                    .from('test_attempts')
                    .select('*')
                    .eq('id', attemptId)
                    .single()

                if (attemptError) throw attemptError
                setAttempt(attemptData)

                // Fetch test details
                const { data: testData, error: testError } = await supabase
                    .from('tests')
                    .select('*')
                    .eq('id', attemptData.test_id)
                    .single()

                if (testError) throw testError
                setTest(testData)

                // Fetch questions for review
                const { data: questionsData, error: questionsError } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('test_id', attemptData.test_id)
                    .order('order_index')

                if (questionsError) throw questionsError
                setQuestions(questionsData)

            } catch (error) {
                console.error("Error fetching results:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [attemptId, supabase])

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    if (!attempt || !test) return <div className="p-8">Result not found</div>

    const isPassed = attempt.score >= (test.passing_score || 70)

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Result Summary */}
                <Card className={isPassed ? "border-t-4 border-t-green-500" : "border-t-4 border-t-red-500"}>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            {isPassed ? (
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            ) : (
                                <XCircle className="h-16 w-16 text-red-500" />
                            )}
                        </div>
                        <CardTitle className="text-3xl font-bold">
                            {isPassed ? "Passed!" : "Keep Practicing"}
                        </CardTitle>
                        <CardDescription className="text-xl mt-2">
                            You scored {attempt.score}%
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center gap-8 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Points</p>
                            <p className="text-2xl font-bold">{attempt.points_earned} / {attempt.total_points}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Time</p>
                            <p className="text-2xl font-bold">
                                {Math.floor(attempt.time_spent_seconds / 60)}m {attempt.time_spent_seconds % 60}s
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Question Review */}
                {test.show_correct_answers && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Review Answers</h3>
                        {questions.map((q, index) => {
                            const userAnswer = attempt.answers?.[q.id]
                            const isCorrect = userAnswer === q.correct_answer

                            return (
                                <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-medium">Question {index + 1}</CardTitle>
                                            <Badge variant={isCorrect ? "default" : "destructive"}>
                                                {isCorrect ? "Correct" : "Incorrect"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p>{q.question_text}</p>

                                        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                                            <div className="flex gap-2">
                                                <span className="font-semibold w-24">Your Answer:</span>
                                                <span className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                    {userAnswer ? `${userAnswer}. ${q.options[q.options.findIndex((o: any, i: any) => String.fromCharCode(65 + i) === userAnswer)] || ''}` : 'No Answer'}
                                                </span>
                                            </div>
                                            {!isCorrect && (
                                                <div className="flex gap-2">
                                                    <span className="font-semibold w-24">Correct:</span>
                                                    <span className="text-green-600 font-medium">
                                                        {q.correct_answer}. {q.options[q.options.findIndex((o: any, i: any) => String.fromCharCode(65 + i) === q.correct_answer)] || ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {q.explanation && (
                                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg text-sm">
                                                <span className="font-semibold text-blue-700 dark:text-blue-300">Explanation:</span>
                                                <p className="mt-1 text-blue-600 dark:text-blue-200">{q.explanation}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/student')}>
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                    <Button onClick={() => router.push(`/student/unit/${test.unit_id}`)}>
                        Back to Unit
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
