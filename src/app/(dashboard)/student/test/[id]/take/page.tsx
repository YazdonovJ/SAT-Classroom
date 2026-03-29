import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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
        .select('course_id, title')
        .eq('id', test.unit_id)
        .single()

    const enrollment = enrollments?.find((e: any) => e.cohorts?.course_id === unit?.course_id)

    if (!enrollment) redirect('/student')

    // Get student profile name
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const studentName = profile?.full_name || user.email?.split('@')[0] || 'Student'

    return (
        <TakeTestClient
            test={test}
            questions={questions || []}
            cohortId={enrollment.cohort_id}
            studentName={studentName}
            unitName={unit?.title || 'Unit'}
        />
    )
}
