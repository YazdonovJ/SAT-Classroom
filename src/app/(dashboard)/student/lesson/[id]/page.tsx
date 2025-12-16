import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, CheckCircle } from "lucide-react"
import Link from "next/link"
import { MarkCompleteButton } from "@/components/student/mark-complete-button"

export default async function LessonPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id: lessonId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch lesson details
    const { data: lesson } = await supabase
        .from('lessons')
        .select('*, units(id, title, course_id, courses(title))')
        .eq('id', lessonId)
        .single()

    if (!lesson) {
        redirect('/student')
    }

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/student/unit/${lesson.units.id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span>{lesson.units.courses?.title}</span>
                        <span>→</span>
                        <span>{lesson.units.title}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
                </div>
                <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    In Progress
                </Badge>
            </div>

            {/* Lesson Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Lesson Content</CardTitle>
                    <CardDescription>
                        Read through the material and complete any practice exercises
                    </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                    <div className="text-lg leading-relaxed">
                        {lesson.content}
                    </div>
                </CardContent>
            </Card>

            {/* Practice Section (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle>Practice Questions</CardTitle>
                    <CardDescription>
                        Test your understanding with practice problems
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Practice questions coming soon!</p>
                    <p className="text-sm mt-2">Work through the lesson content above to prepare.</p>
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Link href={`/student/unit/${lesson.units.id}`}>
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Unit
                    </Button>
                </Link>
                <MarkCompleteButton lessonId={lesson.id} unitId={lesson.units.id} />
            </div>
        </div>
    )
}
