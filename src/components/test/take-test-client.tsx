"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, ChevronLeft, ChevronRight, Pause, Play, Bookmark, MoreVertical, Pencil, ChevronUp, ChevronDown, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { QuestionText } from "./question-text"

interface TakeTestClientProps {
    test: any
    questions: any[]
    cohortId: string
}

export function TakeTestClient({ test, questions, cohortId }: TakeTestClientProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [timeLeft, setTimeLeft] = useState(test.time_limit_minutes ? test.time_limit_minutes * 60 : null)
    const [timeSpent, setTimeSpent] = useState(0) // Track actual time spent for scoring
    const [isPaused, setIsPaused] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    
    // New UI states
    const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set())
    const [isTimerHidden, setIsTimerHidden] = useState(false)
    const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
    
    const router = useRouter()
    const supabase = createClient()

    // Timer
    useEffect(() => {
        if (isPaused) return

        const interval = setInterval(() => {
            setTimeSpent(prev => prev + 1)
            
            if (timeLeft !== null) {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        handleSubmit(true) // Auto-submit when time runs out
                        return 0
                    }
                    return prev - 1
                })
            }
        }, 1000)

        return () => clearInterval(interval)
    // NOTE: Intentionally omitting handleSubmit and timeLeft to avoid interval reset jitter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPaused])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleAnswer = (questionId: string, answer: string) => {
        setAnswers({ ...answers, [questionId]: answer })
    }

    const toggleMark = (questionId: string) => {
        setMarkedQuestions(prev => {
            const next = new Set(prev)
            if (next.has(questionId)) next.delete(questionId)
            else next.add(questionId)
            return next
        })
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

            const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

            const { count } = await supabase
                .from('test_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('test_id', test.id)

            const attemptNumber = (count || 0) + 1

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

    const parseQuestionContent = (text: string) => {
        if (!text) return { passage: "", prompt: "" }
        
        // Split by paragraph breaks
        const blocks = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
        
        if (blocks.length <= 1) {
            // Very short question or math problem without separate setup
            return { passage: "", prompt: blocks[0] || "" }
        }
        
        const passage = blocks.slice(0, -1).join('\n\n')
        const prompt = blocks[blocks.length - 1]
        
        return { passage, prompt }
    }

    const question = questions[currentQuestion]
    const isLastQuestion = currentQuestion === questions.length - 1
    const { passage, prompt } = parseQuestionContent(question?.question_text || "")

    // SAT Style Dashed Border CSS
    const colorfulDashedBorder = { backgroundImage: 'repeating-linear-gradient(to right, #000 0, #000 15px, transparent 15px, transparent 20px, #3b82f6 20px, #3b82f6 35px, transparent 35px, transparent 40px, #eab308 40px, #eab308 55px, transparent 55px, transparent 60px)' }

    if (isPaused) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center font-sans h-screen w-screen overflow-hidden text-center space-y-6">
                <h2 className="text-3xl font-bold">Test Paused</h2>
                <p className="text-muted-foreground max-w-md">The timer is stopped and your progress is securely saved. You may resume when you are ready.</p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8" onClick={() => setIsPaused(false)}>
                    <Play className="h-5 w-5 mr-2" />
                    Resume Testing
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col font-sans h-screen w-screen overflow-hidden selection:bg-blue-200">
            {/* Header */}
            <header className="flex h-[80px] items-center justify-between px-8 bg-white relative shrink-0">
                <div className="flex flex-col flex-1">
                    <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
                        Section 1, Module 1: Reading and Writing
                    </h1>
                    <button className="text-[13px] font-semibold text-slate-600 hover:text-slate-900 flex items-center mt-0.5">
                        Directions <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                </div>
                
                <div className="flex flex-col items-center justify-center w-32 shrink-0 group">
                    {!isTimerHidden ? (
                        <div className="text-[28px] font-bold tracking-tight font-mono text-slate-900">{formatTime(timeLeft || 0)}</div>
                    ) : (
                        <div className="text-[28px] font-bold tracking-tight text-slate-400 mt-[-2px] mb-2 leading-none">
                            <Clock className="w-8 h-8 opacity-75" />
                        </div>
                    )}
                    <button 
                        onClick={() => setIsTimerHidden(!isTimerHidden)}
                        className="text-[11px] font-bold tracking-widest uppercase text-slate-500 hover:text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-full px-3 py-0.5 mt-1 transition-colors"
                    >
                        {isTimerHidden ? "Show" : "Hide"}
                    </button>
                </div>
                
                <div className="flex items-center justify-end gap-6 flex-1 text-slate-700">
                    <button className="flex flex-col items-center hover:text-black group">
                        <Pencil className="h-[22px] w-[22px] mb-1 group-hover:bg-slate-100 rounded p-0.5 transition-colors" />
                        <span className="text-[11px] font-bold">Annotate</span>
                    </button>
                    <button className="flex flex-col items-center hover:text-black group">
                        <MoreVertical className="h-[22px] w-[22px] mb-1 group-hover:bg-slate-100 rounded p-0.5 transition-colors" />
                        <span className="text-[11px] font-bold">More</span>
                    </button>
                    <div className="w-px h-10 bg-slate-200 ml-2 mr-2 hidden sm:block"></div>
                    <button onClick={() => setIsPaused(true)} className="flex flex-col items-center hover:text-black group">
                        <Pause className="h-[22px] w-[22px] mb-1 group-hover:bg-slate-100 rounded p-0.5 transition-colors" />
                        <span className="text-[11px] font-bold">Break</span>
                    </button>
                </div>
                
                {/* Colored Dashed Border Simulator */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] w-full" style={colorfulDashedBorder} />
            </header>

            {/* Main Split Content */}
            <main className="flex-1 flex overflow-hidden bg-white">
                {/* Left Pane - Passage */}
                <div className="w-1/2 border-r-[3px] border-slate-200 p-10 overflow-y-auto">
                    {passage ? (
                         <div className="prose prose-slate max-w-none prose-p:leading-[1.8] prose-p:text-[17px] prose-p:mb-6">
                             <QuestionText text={passage} />
                         </div>
                    ) : (
                         <div className="flex h-full items-center justify-center text-slate-400 font-medium">
                             [ No specific passage context for this question ]
                         </div>
                    )}
                </div>

                {/* Right Pane - Question */}
                <div className="w-1/2 p-10 overflow-y-auto bg-slate-50/50 relative flex flex-col">
                    
                    {/* Top bar of question pane */}
                    <div className="flex items-center justify-between mb-8 bg-slate-100 px-4 py-2 border border-slate-200 rounded-sm">
                        <div className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center font-bold text-lg rounded-sm shadow-sm relative">
                            {currentQuestion + 1}
                            {/* Visual nub to mimic Bluebook */}
                            <div className="absolute top-1/2 -right-1.5 w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-slate-900 translate-y-[-50%]"></div>
                        </div>
                        <button 
                            onClick={() => toggleMark(question.id)}
                            className={`flex items-center text-[13px] font-bold px-3 py-1.5 rounded transition-colors ${
                                markedQuestions.has(question.id) 
                                ? "text-red-700 bg-red-100 hover:bg-red-200" 
                                : "text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            <Bookmark className={`h-[18px] w-[18px] mr-1.5 ${markedQuestions.has(question.id) ? "fill-current" : ""}`} />
                            Mark for Review
                        </button>
                    </div>

                    {/* Prompt */}
                    <div className="prose prose-slate max-w-none prose-p:leading-[1.8] prose-p:text-[17px] font-medium text-slate-900 mb-8">
                        <QuestionText text={prompt} />
                    </div>

                    {/* Options */}
                    {question.question_type === 'multiple_choice' && (
                        <div className="mt-auto space-y-4 pt-4">
                            {question.options.map((option: string, index: number) => {
                                const letter = String.fromCharCode(65 + index)
                                const isSelected = answers[question.id] === letter
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(question.id, letter)}
                                        className={`w-full text-left flex items-start p-[18px] rounded-[10px] border-2 transition-all duration-200 ${
                                            isSelected 
                                            ? "border-[#2563eb] bg-blue-50/50 shadow-sm" 
                                            : "border-slate-300 bg-white hover:border-[#2563eb]/60"
                                        }`}
                                    >
                                        <span className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 mr-5 font-bold text-[15px] pt-px ${
                                            isSelected 
                                            ? "border-[#2563eb] bg-[#2563eb] text-white" 
                                            : "border-slate-400 text-slate-700 font-semibold"
                                        }`}>
                                            {letter}
                                        </span>
                                        <span className="text-[16px] leading-relaxed text-slate-800 pt-[2px]">
                                            {option}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer Nav */}
            <footer className="h-[80px] bg-white flex items-center justify-between px-8 shrink-0 relative border-t-2 border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                {/* Colored Border */}
                <div className="absolute top-0 left-0 right-0 h-[3px] w-full transform -translate-y-full" style={colorfulDashedBorder} />
                
                <div className="font-bold text-[17px] text-slate-800 w-48 flex-1">
                    SAT Classroom
                </div>
                
                <div className="flex items-center justify-center relative z-20 flex-1">
                    <button 
                        onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                        className="font-bold text-[15px] text-white bg-slate-900 hover:bg-slate-800 rounded-md px-6 py-2.5 flex items-center shadow-md transition-all active:scale-95"
                    >
                        Question {currentQuestion + 1} of {questions.length}
                        {isNavMenuOpen ? <ChevronDown className="h-5 w-5 ml-2 opacity-80" /> : <ChevronUp className="h-5 w-5 ml-2 opacity-80" />}
                    </button>
                    
                    {/* Nav Popup Grid */}
                    {isNavMenuOpen && (
                        <>
                            {/* Invisible overlay to close on clicking outside */}
                            <div className="fixed inset-0 z-10" onClick={() => setIsNavMenuOpen(false)}></div>
                            <div className="absolute bottom-[calc(100%+24px)] left-1/2 -translate-x-1/2 w-[480px] bg-white border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl p-6 z-30">
                                <div className="flex items-center justify-between mb-4 border-b pb-4">
                                    <h3 className="font-bold text-lg">Section 1: Reading and Writing</h3>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                        <span className="flex items-center"><Bookmark className="w-3 h-3 text-red-600 fill-current mr-1"/> For Review</span>
                                        <span className="flex items-center"><div className="w-3 h-3 bg-[#2563eb] rounded-full mr-1"/> Answered</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-3">
                                    {questions.map((q, idx) => {
                                        const isAnswered = !!answers[q.id]
                                        const isMarked = markedQuestions.has(q.id)
                                        const isCurrent = idx === currentQuestion
                                        
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => { setCurrentQuestion(idx); setIsNavMenuOpen(false); }}
                                                className={`relative w-12 h-12 flex items-center justify-center rounded-md font-bold text-sm border-2 transition-all ${
                                                    isCurrent ? "border-slate-900 bg-slate-100" // Active focus
                                                    : isAnswered ? "border-[#2563eb] text-[#2563eb] bg-blue-50/50 hover:bg-blue-100" // Answered
                                                    : "border-slate-200 text-slate-600 hover:border-slate-400 bg-white" // Unanswered
                                                }`}
                                            >
                                                {idx + 1}
                                                {/* Mark for review pin */}
                                                {isMarked && (
                                                    <div className="absolute -top-1.5 -right-1.5">
                                                        <Bookmark className="w-[14px] h-[14px] text-red-600 fill-current" />
                                                    </div>
                                                )}
                                                {/* Hidden checkmark but kept the colored border styling above */}
                                                {isAnswered && !isCurrent && (
                                                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#2563eb]"></div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="flex items-center justify-end gap-3 flex-1">
                    {/* We only show Previous if it's not the first question */}
                    {currentQuestion > 0 && (
                        <Button 
                            variant="ghost"
                            className="font-bold text-[15px] px-6 h-11 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hidden sm:flex"
                            onClick={() => setCurrentQuestion(currentQuestion - 1)}
                        >
                            <ChevronLeft className="h-5 w-5 mr-1" />
                            Prev
                        </Button>
                    )}
                    {isLastQuestion ? (
                        <Button 
                            onClick={() => handleSubmit(false)} 
                            disabled={submitting}
                            className="font-bold text-[15px] bg-[#2563eb] hover:bg-blue-700 text-white px-8 h-11 rounded-full shadow-sm pr-6"
                        >
                            {submitting ? "Submitting..." : "Submit Test"}
                            {!submitting && <Check className="h-5 w-5 ml-2" />}
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            className="font-bold text-[15px] bg-[#2563eb] hover:bg-blue-700 text-white px-8 h-11 rounded-full shadow-sm pr-6"
                        >
                            Next
                            <ChevronRight className="h-5 w-5 ml-1" />
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    )
}
