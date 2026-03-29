"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
    const [timeSpent, setTimeSpent] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set())
    const [isTimerHidden, setIsTimerHidden] = useState(false)
    const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (isPaused) return
        const interval = setInterval(() => {
            setTimeSpent(prev => prev + 1)
            if (timeLeft !== null) {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) { handleSubmit(true); return 0 }
                    return prev - 1
                })
            }
        }, 1000)
        return () => clearInterval(interval)
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
            let totalPoints = 0, earnedPoints = 0
            questions.forEach(q => {
                totalPoints += q.points
                if (answers[q.id] === q.correct_answer) earnedPoints += q.points
            })
            const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
            const { count } = await supabase.from('test_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('test_id', test.id)
            const { data: attempt, error } = await supabase.from('test_attempts').insert({
                test_id: test.id, user_id: user.id, cohort_id: cohortId, answers, score,
                points_earned: earnedPoints, total_points: totalPoints,
                submitted_at: new Date().toISOString(), time_spent_seconds: timeSpent,
                attempt_number: (count || 0) + 1
            }).select().single()
            if (error) throw error
            toast.success(`Test submitted! Score: ${score}%`)
            router.push(`/student/test/${test.id}/results?attempt=${attempt.id}`)
        } catch (error: any) {
            toast.error("Failed to submit test", { description: error.message })
            setSubmitting(false)
        }
    }

    /* ── Question parsing ─────────────────────────────────── */
    const parseQuestionContent = (text: string) => {
        if (!text) return { passage: "", prompt: "" }
        const promptPatterns = [
            /which choice most (?:logically|effectively)/i,
            /which choice (?:best )?completes/i,
            /which choice best describes/i,
            /which finding/i,
            /based on the text/i,
            /according to the text/i,
            /what is the main/i,
        ]
        const lines = text.split('\n')
        let splitIdx = -1
        for (let i = lines.length - 1; i >= 0; i--) {
            if (promptPatterns.some(p => p.test(lines[i]))) { splitIdx = i; break }
        }
        if (splitIdx > 0) {
            return { passage: lines.slice(0, splitIdx).join('\n').trim(), prompt: lines.slice(splitIdx).join('\n').trim() }
        }
        const blocks = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
        if (blocks.length <= 1) return { passage: "", prompt: text }
        return { passage: blocks.slice(0, -1).join('\n\n'), prompt: blocks[blocks.length - 1] }
    }

    const question = questions[currentQuestion]
    const isLastQuestion = currentQuestion === questions.length - 1
    const { passage, prompt } = parseQuestionContent(question?.question_text || "")

    /* ── Pause screen ──────────────────────────────────────── */
    if (isPaused) {
        return (
            <div style={{ position:'fixed', inset:0, zIndex:99999 }} className="bg-white flex flex-col items-center justify-center">
                <div className="text-center space-y-5">
                    <Pause className="w-16 h-16 mx-auto text-slate-300" />
                    <h2 className="text-2xl font-bold text-slate-800">Test Paused</h2>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm">Your timer is stopped and progress is saved.</p>
                    <button onClick={() => setIsPaused(false)} className="inline-flex items-center bg-[#1d4ed8] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#1e40af] transition-colors">
                        <Play className="w-4 h-4 mr-2" /> Resume Test
                    </button>
                </div>
            </div>
        )
    }

    /* ── Main render ───────────────────────────────────────── */
    return (
        <div style={{ position:'fixed', inset:0, zIndex:99999 }} className="bg-white flex flex-col">

            {/* ═══ HEADER ═══ */}
            <div className="shrink-0 border-b border-slate-200">
                <div className="h-14 flex items-center justify-between px-6">
                    {/* Left: Section info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">Section 1, Module 1: Reading and Writing</p>
                            <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center mt-0.5 font-medium">
                                Directions <ChevronDown className="w-3 h-3 ml-0.5" />
                            </button>
                        </div>
                    </div>

                    {/* Center: Timer */}
                    <div className="flex flex-col items-center shrink-0 mx-6">
                        {!isTimerHidden && (
                            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums leading-none">
                                {formatTime(timeLeft || 0)}
                            </span>
                        )}
                        <button
                            onClick={() => setIsTimerHidden(!isTimerHidden)}
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 mt-0.5"
                        >
                            {isTimerHidden ? "Show" : "Hide"}
                        </button>
                    </div>

                    {/* Right: Tools */}
                    <div className="flex items-center gap-5 flex-1 justify-end">
                        <button className="flex flex-col items-center text-slate-500 hover:text-slate-800 transition-colors">
                            <Pencil className="w-4 h-4" />
                            <span className="text-[10px] font-semibold mt-0.5">Annotate</span>
                        </button>
                        <button className="flex flex-col items-center text-slate-500 hover:text-slate-800 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                            <span className="text-[10px] font-semibold mt-0.5">More</span>
                        </button>
                        <div className="w-px h-6 bg-slate-200" />
                        <button onClick={() => setIsPaused(true)} className="flex flex-col items-center text-slate-500 hover:text-slate-800 transition-colors">
                            <Pause className="w-4 h-4" />
                            <span className="text-[10px] font-semibold mt-0.5">Break</span>
                        </button>
                    </div>
                </div>
                {/* Dashed color border */}
                <div className="h-[3px]" style={{ backgroundImage: 'repeating-linear-gradient(to right, #1e293b 0 12px, transparent 12px 16px, #3b82f6 16px 28px, transparent 28px 32px, #eab308 32px 44px, transparent 44px 48px)' }} />
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="flex-1 flex min-h-0">
                {/* Left: Passage */}
                <div className="w-1/2 overflow-y-auto border-r border-slate-200 px-8 py-6">
                    {passage ? (
                        <div className="text-[15px] leading-[1.75] text-slate-700 max-w-[540px]">
                            <QuestionText text={passage} />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-sm text-slate-400 italic">No passage for this question.</p>
                        </div>
                    )}
                </div>

                {/* Right: Question + Options */}
                <div className="w-1/2 overflow-y-auto px-8 py-6 flex flex-col">
                    {/* Question badge + Mark for Review */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-9 h-9 bg-slate-900 text-white text-sm font-bold rounded">
                                {currentQuestion + 1}
                            </span>
                            <button
                                onClick={() => toggleMark(question.id)}
                                className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                                    markedQuestions.has(question.id)
                                        ? "text-red-700 bg-red-50"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <Bookmark className={`w-3.5 h-3.5 mr-1 ${markedQuestions.has(question.id) ? "fill-current" : ""}`} />
                                Mark for Review
                            </button>
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="text-[15px] leading-[1.7] text-slate-800 mb-5">
                        <QuestionText text={prompt} />
                    </div>

                    {/* Options — pushed right after the prompt, no mt-auto */}
                    {question.question_type === 'multiple_choice' && (
                        <div className="space-y-3">
                            {question.options.map((option: string, index: number) => {
                                const letter = String.fromCharCode(65 + index)
                                const isSelected = answers[question.id] === letter
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(question.id, letter)}
                                        className={`w-full text-left flex items-start px-4 py-3.5 rounded-lg border-2 transition-all duration-150 ${
                                            isSelected
                                                ? "border-[#2563eb] bg-blue-50/60"
                                                : "border-slate-200 hover:border-slate-400 bg-white"
                                        }`}
                                    >
                                        <span className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold mr-3.5 mt-0.5 ${
                                            isSelected
                                                ? "border-[#2563eb] bg-[#2563eb] text-white"
                                                : "border-slate-400 text-slate-600"
                                        }`}>
                                            {letter}
                                        </span>
                                        <span className="text-[14px] leading-relaxed text-slate-700 pt-[3px]">{option}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="shrink-0 border-t border-slate-200 relative">
                <div className="h-[3px]" style={{ backgroundImage: 'repeating-linear-gradient(to right, #1e293b 0 12px, transparent 12px 16px, #3b82f6 16px 28px, transparent 28px 32px, #eab308 32px 44px, transparent 44px 48px)' }} />
                <div className="h-14 flex items-center justify-between px-6">
                    {/* Left: Brand */}
                    <span className="text-sm font-bold text-slate-700 flex-1">SAT Classroom</span>

                    {/* Center: Question nav trigger */}
                    <div className="relative flex-1 flex justify-center">
                        <button
                            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                            className="inline-flex items-center bg-slate-900 text-white text-sm font-semibold px-5 py-2 rounded hover:bg-slate-800 transition-colors"
                        >
                            Question {currentQuestion + 1} of {questions.length}
                            {isNavMenuOpen ? <ChevronDown className="w-4 h-4 ml-1.5" /> : <ChevronUp className="w-4 h-4 ml-1.5" />}
                        </button>

                        {/* Nav grid popup */}
                        {isNavMenuOpen && (
                            <>
                                <div className="fixed inset-0" style={{ zIndex: 10 }} onClick={() => setIsNavMenuOpen(false)} />
                                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-96 bg-white border border-slate-200 shadow-xl rounded-lg p-5" style={{ zIndex: 20 }}>
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                                        <span className="text-sm font-bold text-slate-800">Question Navigator</span>
                                        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" /> Answered</span>
                                            <span className="flex items-center gap-1"><Bookmark className="w-2.5 h-2.5 fill-red-500 text-red-500" /> Review</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-9 gap-1.5">
                                        {questions.map((q, idx) => {
                                            const isAnswered = !!answers[q.id]
                                            const isMarked = markedQuestions.has(q.id)
                                            const isCurrent = idx === currentQuestion
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => { setCurrentQuestion(idx); setIsNavMenuOpen(false) }}
                                                    className={`relative w-9 h-9 flex items-center justify-center rounded text-xs font-bold transition-all ${
                                                        isCurrent
                                                            ? "bg-slate-900 text-white"
                                                            : isAnswered
                                                                ? "bg-blue-50 text-[#2563eb] border border-[#2563eb]"
                                                                : "bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-400"
                                                    }`}
                                                >
                                                    {idx + 1}
                                                    {isMarked && <Bookmark className="absolute -top-1 -right-1 w-2.5 h-2.5 fill-red-500 text-red-500" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Nav buttons */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        {currentQuestion > 0 && (
                            <button
                                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                                className="inline-flex items-center text-sm font-semibold text-[#2563eb] hover:text-blue-800 px-3 py-2 rounded hover:bg-blue-50 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 mr-0.5" /> Back
                            </button>
                        )}
                        {isLastQuestion ? (
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="inline-flex items-center bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-colors disabled:opacity-50"
                            >
                                {submitting ? "Submitting..." : "Submit"} {!submitting && <Check className="w-4 h-4 ml-1" />}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                                className="inline-flex items-center bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-colors"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-0.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
