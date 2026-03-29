"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, AlertCircle, ArrowRight, History, Trophy, TrendingUp, Eye } from "lucide-react"
import { toast } from "sonner"

export default function TestOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const [test, setTest] = useState<any>(null)
    const [attempts, setAttempts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { id } = await params
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push('/login'); return }

                const { data: testData, error: testError } = await supabase
                    .from('tests')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (testError) throw testError
                setTest(testData)

                // Fetch all attempts for this user and test
                const { data: attemptsData } = await supabase
                    .from('test_attempts')
                    .select('*')
                    .eq('test_id', id)
                    .eq('user_id', user.id)
                    .order('submitted_at', { ascending: false })

                setAttempts(attemptsData || [])
            } catch (error) {
                console.error('Error fetching test:', error)
                toast.error('Failed to load test details')
                router.push('/student')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!test) return null

    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null
    const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : null

    const formatDate = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    }

    const formatDuration = (seconds: number) => {
        if (!seconds) return '—'
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}m ${s}s`
    }

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-6 max-w-3xl mx-auto">

            {/* Test Info Card */}
            <Card>
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold">{test.title}</CardTitle>
                    <CardDescription className="text-base">
                        {test.description || "No description provided."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                            <Clock className="h-7 w-7 text-primary mb-1.5" />
                            <span className="font-semibold text-sm">Time Limit</span>
                            <span className="text-muted-foreground text-sm">
                                {test.time_limit_minutes ? `${test.time_limit_minutes} mins` : 'No limit'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                            <CheckCircle2 className="h-7 w-7 text-green-500 mb-1.5" />
                            <span className="font-semibold text-sm">Passing Score</span>
                            <span className="text-muted-foreground text-sm">{test.passing_score}%</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                            <AlertCircle className="h-7 w-7 text-orange-500 mb-1.5" />
                            <span className="font-semibold text-sm">Your Attempts</span>
                            <span className="text-muted-foreground text-sm">{attempts.length}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions</h4>
                        <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
                            <li>Read each question carefully before answering.</li>
                            <li>You can review your answers before submitting.</li>
                            <li>Once submitted, you cannot change your answers.</li>
                            {test.time_limit_minutes && <li>The timer will start as soon as you click &quot;Start Test&quot;.</li>}
                        </ul>
                    </div>

                    <Button
                        size="lg"
                        className="w-full text-lg py-6"
                        onClick={() => router.push(`/student/test/${test.id}/take`)}
                    >
                        {attempts.length > 0 ? 'Retake Test' : 'Start Test'} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardContent>
            </Card>

            {/* Attempt History */}
            {attempts.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                <CardTitle className="text-lg">Attempt History</CardTitle>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                {bestScore !== null && (
                                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                                        <Trophy className="w-4 h-4" /> Best: {bestScore}%
                                    </span>
                                )}
                                {avgScore !== null && (
                                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                                        <TrendingUp className="w-4 h-4" /> Avg: {avgScore}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {attempts.map((attempt, idx) => {
                                const passed = attempt.score >= (test.passing_score || 0)
                                return (
                                    <div key={attempt.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                                passed
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {attempt.score}%
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Attempt #{attempt.attempt_number || attempts.length - idx}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(attempt.submitted_at)}
                                                    {attempt.time_spent_seconds ? ` • ${formatDuration(attempt.time_spent_seconds)}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                passed
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {passed ? 'Passed' : 'Failed'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/student/test/${test.id}/results?attempt=${attempt.id}`)}
                                                className="text-xs"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1" /> Review
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
