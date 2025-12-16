
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Calendar } from "lucide-react"
import { ClassContent } from "@/components/teacher/class-content"
import { ClassHeader } from "@/components/teacher/class-header"

export default async function ClassManagePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch cohort details
    const { data: cohort } = await supabase
        .from('cohorts')
        .select('*, courses(title, description)')
        .eq('id', id)
        .single()

    if (!cohort) {
        console.error('Cohort not found:', id)
        redirect('/teacher')
    }

    // Ensure courses is loaded
    const cohortWithCourses = {
        ...cohort,
        courses: cohort.courses || { title: 'Unknown', description: '' }
    }


    // Fetch enrolled students
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, users(full_name, email)')
        .eq('cohort_id', id)

    const students = enrollments || []

    // Fetch course units
    const { data: units } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', cohort.course_id)
        .order('order_index')

    // Get unlock states
    const { data: unlockStates } = await supabase
        .from('cohort_unit_state')
        .select('unit_id, is_unlocked')
        .eq('cohort_id', id)

    const unitsWithState = units?.map(unit => ({
        ...unit,
        is_unlocked: unlockStates?.find(s => s.unit_id === unit.id)?.is_unlocked || false
    })) || []

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <ClassHeader
                cohortId={id}
                cohortName={cohort.name}
                courseName={cohort.courses?.title || 'No course assigned'}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Students</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Course Level</CardTitle>
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cohortWithCourses.courses?.title || 'Unknown'}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Assignments</CardTitle>
                        <Calendar className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <ClassContent
                cohort={cohortWithCourses}
                students={students}
                units={unitsWithState}
            />
        </div>
    )
}
