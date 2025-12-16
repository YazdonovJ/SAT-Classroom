
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Lock, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function StudentClassPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Get class details
    const { data: cohort } = await supabase
        .from('cohorts')
        .select('*, courses(id, title, description)')
        .eq('id', id)
        .single()

    if (!cohort) redirect('/student')

    // Check enrollment
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('cohort_id', id)
        .eq('user_id', user.id)
        .single()

    if (!enrollment) redirect('/student')

    // Get course units
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

    const unlockedCount = unitsWithState.filter(u => u.is_unlocked).length
    const totalCount = unitsWithState.length

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/student">
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5 rotate-180" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{cohort.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {cohort.courses?.title || 'SAT Prep'}
                    </p>
                </div>
            </div>

            {/* Progress */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Your Progress</CardTitle>
                            <CardDescription>
                                {unlockedCount} of {totalCount} units available
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-primary">
                                {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                            style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Units */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Course Units</h2>
                {unitsWithState.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No content yet</h3>
                            <p className="text-muted-foreground text-center max-w-sm">
                                Your teacher hasn't added content to this class yet. Check back soon!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {unitsWithState.map((unit, index) => (
                            <Card
                                key={unit.id}
                                className={`${unit.is_unlocked
                                        ? 'hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary'
                                        : 'opacity-60'
                                    }`}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${unit.is_unlocked ? 'bg-primary' : 'bg-muted-foreground'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{unit.title}</CardTitle>
                                                    {unit.description && (
                                                        <CardDescription className="mt-1">
                                                            {unit.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {unit.is_unlocked ? (
                                            <Badge variant="default" className="bg-green-500">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Available
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Locked
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {unit.is_unlocked ? (
                                        <Button className="w-full" asChild>
                                            <Link href={`/student/unit/${unit.id}`}>
                                                Start Learning
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button className="w-full" disabled>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Ask your teacher to unlock
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
