"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export default function TestOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const [test, setTest] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchTest = async () => {
            const { id } = await params
            try {
                const { data, error } = await supabase
                    .from('tests')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setTest(data)
            } catch (error) {
                console.error('Error fetching test:', error)
                toast.error('Failed to load test details')
                router.push('/student')
            } finally {
                setLoading(false)
            }
        }
        fetchTest()
    }, [params, router, supabase])

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!test) return null

    return (
        <div className="min-h-screen bg-muted/20 p-8 flex items-center justify-center">
            <Card className="max-w-2xl w-full">
                <CardHeader className="text-center space-y-4">
                    <CardTitle className="text-3xl font-bold">{test.title}</CardTitle>
                    <CardDescription className="text-lg">
                        {test.description || "No description provided."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                            <Clock className="h-8 w-8 text-primary mb-2" />
                            <span className="font-semibold">Time Limit</span>
                            <span className="text-muted-foreground">
                                {test.time_limit_minutes ? `${test.time_limit_minutes} mins` : 'No limit'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                            <span className="font-semibold">Passing Score</span>
                            <span className="text-muted-foreground">{test.passing_score}%</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                            <AlertCircle className="h-8 w-8 text-orange-500 mb-2" />
                            <span className="font-semibold">Attempts</span>
                            <span className="text-muted-foreground">Unlimited</span>
                            {/* TODO: Add max attempts logic check if implemented */}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions</h4>
                        <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
                            <li>Read each question carefully before answering.</li>
                            <li>You can review your answers before submitting.</li>
                            <li>Once submitted, you cannot change your answers.</li>
                            {test.time_limit_minutes && <li>The timer will start as soon as you click "Start Test".</li>}
                        </ul>
                    </div>

                    <Button
                        size="lg"
                        className="w-full text-lg py-6"
                        onClick={() => router.push(`/student/test/${test.id}/take`)}
                    >
                        Start Test <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
