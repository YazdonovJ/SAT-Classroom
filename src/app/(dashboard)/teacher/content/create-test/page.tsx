import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CreateTestForm } from "@/components/content/create-test-form"

export default async function CreateTestPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch units from courses the teacher teaches
    const { data: cohorts } = await supabase
        .from('cohort_teachers')
        .select('cohorts(course_id)')
        .eq('user_id', user.id)

    const courseIds = cohorts?.map((c: any) => c.cohorts?.course_id || c.cohorts?.[0]?.course_id).filter(Boolean) || []

    const { data: units } = await supabase
        .from('units')
        .select('*')
        .in('course_id', courseIds)
        .order('order_index')

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <Link href="/teacher/content">
                <Button variant="ghost">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Content
                </Button>
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Test</h1>
                <p className="text-muted-foreground mt-1">
                    Build a new test or quiz for your students
                </p>
            </div>

            <CreateTestForm units={units || []} />
        </div>
    )
}
