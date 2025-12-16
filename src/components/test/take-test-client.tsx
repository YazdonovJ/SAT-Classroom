"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TakeTestClientProps {
    test: any
    questions: any[]
    cohortId: string
}

export function TakeTestClient({ test, questions, cohortId }: TakeTestClientProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [timeLeft, setTimeLeft] = useState(test.time_limit_minutes ? test.time_limit_minutes * 60 : null)
    const [startTime] = useState(Date.now())
    const [submitting, setSubmitting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Timer
    useEffect(() => {
        if (timeLeft === null) return

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 0) {
                    handleSubmit(true) // Auto-submit when time runs out
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [timeLeft])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleAnswer = (questionId: string, answer: string) => {
        setAnswers({ ...answers, [questionId]: answer })
    }

    const handleSubmit = async (autoSubmit: boolean = false) => {
        if (!autoSubmit && Object.keys(answers).length < questions.length) {
            const confirm = window.confirm("You haven't answered all questions. Submit anyway?")
            if (!confirm) return
        }

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Calculate score
            let correctCount = 0
            let totalPoints = 0
            let earnedPoints = 0

            questions.forEach(q => {
                totalPoints += q.points
                const userAnswer = answers[q.id]
                if (userAnswer === q.correct_answer) {
                    correctCount++
                    earnedPoints += q.points
                }
            })

            const score = Math.round((earnedPoints / totalPoints) * 100)
            const timeSpent = Math.floor((Date.now() - startTime) / 1000)

            // Get attempt number
            const { count } = await supabase
                .from('test_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('test_id', test.id)

            const attemptNumber = (count || 0) + 1

            // Save attempt
            const { data: attempt, error } = await supabase
                .from('test_attempts')
                .insert({
                    test_id: test.id,
                    user_id: user.id,
                    cohort_id: cohortId,
                    answers: answers,
                    score: score,
                    points_earned: earnedPoints,
                    total_points: totalPoints,
                    submitted_at: new Date().toISOString(),
                    time_spent_seconds: timeSpent,
                    attempt_number: attemptNumber
                })
                .select()
                .single()

            if (error) throw error

            toast.success(`Test submitted! Score: ${score}%`)
            router.push(`/student/test/${test.id}/results?attempt=${attempt.id}`)
        } catch (error: any) {
            toast.error("Failed to submit test", {
                description: error.message
            })
            setSubmitting(false)
        }
    }

    const question = questions[currentQuestion]
    const progress = Math.round((currentQuestion / questions.length) * 100)
    const isLastQuestion = currentQuestion === questions.length - 1

    return (
        <div className="space-y-6">
            {/* Header with timer and progress */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Question {currentQuestion + 1} of {questions.length}
                            </p>
                            <Progress value={progress} className="w-64" />
                        </div>
                        {timeLeft !== null && (
                            <div className="flex items-center gap-2 text-lg font-bold">
                                <Clock className="h-5 w-5" />
                                <span className={timeLeft < 60 ? "text-destructive" : ""}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Question */}
            <Card>
                <CardHeader>
                    <CardTitle>Question {currentQuestion + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-lg">{question.question_text}</p>

                    {question.question_type === 'multiple_choice' && (
                        <RadioGroup
                            value={answers[question.id] || ""}
                            onValueChange={(value) => handleAnswer(question.id, value)}
                        >
                            {question.options.map((option: string, index: number) => {
                                const letter = String.fromCharCode(65 + index)
                                return (
                                    <div key={index} className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-muted transition-colors">
                                        <RadioGroupItem value={letter} id={`option-${index}`} />
                                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                            <span className="font-bold mr-2">{letter}.</span>
                                            {option}
                                        </Label>
                                    </div>
                                )
                            })}
                        </RadioGroup>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                {isLastQuestion ? (
                    <Button onClick={() => handleSubmit(false)} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Test"}
                    </Button>
                ) : (
                    <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>

            {/* Answer summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Your Answers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {questions.map((q, index) => (
                            <Button
                                key={q.id}
                                variant={answers[q.id] ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentQuestion(index)}
                                className="w-10 h-10"
                            >
                                {index + 1}
                            </Button>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        {Object.keys(answers).length} of {questions.length} answered
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
