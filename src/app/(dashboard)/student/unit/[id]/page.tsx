import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function UnitLessonsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id: unitId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch unit details
    const { data: unit } = await supabase
        .from('units')
        .select('*, courses(title)')
        .eq('id', unitId)
        .single()

    if (!unit) {
        redirect('/student')
    }

    // Fetch lessons for this unit
    const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('unit_id', unitId)
        .order('order_index')

    // Fetch tests for this unit
    const { data: tests } = await supabase
        .from('tests')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_published', true)
        .order('created_at')

    // Get the cohort this student is enrolled in for this course
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('cohort_id, cohorts(id, name, course_id)')
        .eq('user_id', user.id)

    // Find the cohort for this unit's course
    const enrollment = enrollments?.find((e: any) => e.cohorts?.course_id === unit.course_id)

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/student/class/${enrollment?.cohort_id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{unit.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        {unit.courses?.title || 'Course'}
                    </p>
                </div>
            </div>

            {/* Lessons */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Lessons</h2>
                    <Badge variant="secondary">
                        {lessons?.length || 0} Lessons
                    </Badge>
                </div>

                {!lessons || lessons.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
                            <p className="text-muted-foreground text-center">
                                Lessons will be added soon for this unit.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {lessons.map((lesson, index) => (
                            <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{lesson.title}</CardTitle>
                                                <CardDescription className="mt-2">
                                                    {lesson.content}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/student/lesson/${lesson.id}`} className="flex-1 sm:flex-none">
                                            <Button className="w-full">
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                Start Lesson
                                            </Button>
                                        </Link>
                                        <Badge variant="outline">Not Started</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Tests & Quizzes */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Tests & Quizzes</h2>
                </div>

                {!tests || tests.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No tests yet</h3>
                            <p className="text-muted-foreground text-center">
                                No tests have been published for this unit yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {tests.map((test, index) => (
                            <Card key={test.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{test.title}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {test.description || "No description"}
                                            </CardDescription>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline">{test.passing_score}% Passing</Badge>
                                                {test.time_limit_minutes && (
                                                    <Badge variant="secondary">{test.time_limit_minutes} mins</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Link href={`/student/test/${test.id}`}>
                                        <Button className="w-full" variant="secondary">
                                            Start Test
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
