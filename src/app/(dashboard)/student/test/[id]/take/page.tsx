import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TakeTestClient } from "@/components/test/take-test-client"

export default async function TakeTestPage({
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
        .select('*')
        .eq('id', testId)
        .eq('is_published', true)
        .single()

    if (!test) redirect('/student')

    // Get questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('order_index')

    // Get student's cohort for this test's unit
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('cohort_id, cohorts(course_id)')
        .eq('user_id', user.id)

    const { data: unit } = await supabase
        .from('units')
        .select('course_id')
        .eq('id', test.unit_id)
        .single()

    const enrollment = enrollments?.find((e: any) => e.cohorts?.course_id === unit?.course_id)

    if (!enrollment) redirect('/student')

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href={`/student/unit/${test.unit_id}/tests`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {test.description}
                    </p>
                </div>
            </div>

            <TakeTestClient
                test={test}
                questions={questions || []}
                cohortId={enrollment.cohort_id}
            />
        </div>
    )
}
