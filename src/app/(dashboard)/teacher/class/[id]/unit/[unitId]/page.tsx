import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, FileText, Target } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function UnitAnalyticsPage({
    params
}: {
    params: Promise<{ id: string, unitId: string }>
}) {
    const { id: cohortId, unitId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Get cohort and unit details
    const { data: cohort } = await supabase
        .from('cohorts')
        .select('name')
        .eq('id', cohortId)
        .single()

    const { data: unit } = await supabase
        .from('units')
        .select('title, order_index')
        .eq('id', unitId)
        .single()

    if (!cohort || !unit) redirect(`/teacher/class/${cohortId}`)

    // Get all tests for this unit
    const { data: tests } = await supabase
        .from('tests')
        .select('id, title, passing_score')
        .eq('unit_id', unitId)

    const testIds = tests?.map((t: any) => t.id) || []

    // Get enrolled students
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id, users(full_name, email)')
        .eq('cohort_id', cohortId)

    const students = enrollments?.map((e: any) => ({
        id: e.user_id,
        name: e.users?.full_name || 'Unknown',
        email: e.users?.email || ''
    })) || []

    // Get test attempts for these tests by these students
    let attempts: any[] = []
    if (testIds.length > 0) {
        const { data } = await supabase
            .from('test_attempts')
            .select('*')
            .in('test_id', testIds)
            .eq('cohort_id', cohortId)
        attempts = data || []
    }

    // Process data to build student rows
    const studentPerformance = students.map((student: any) => {
        const studentAttempts = attempts.filter(a => a.user_id === student.id)
        
        // Find best score for each test
        const testScores = tests?.map((test: any) => {
            const testAttempts = studentAttempts.filter(a => a.test_id === test.id)
            if (testAttempts.length === 0) return null
            const bestScore = Math.max(...testAttempts.map(a => a.score || 0))
            const passed = bestScore >= test.passing_score
            return {
                testId: test.id,
                testTitle: test.title,
                bestScore,
                passed,
                attempts: testAttempts.length
            }
        }) || []

        const completedTestsCount = testScores.filter(ts => ts !== null).length
        const totalScore = testScores.reduce((sum: number, ts: any) => sum + (ts?.bestScore || 0), 0)
        const avgScore = completedTestsCount > 0 ? Math.round(totalScore / completedTestsCount) : null

        return {
            ...student,
            testScores,
            avgScore,
            completedTestsCount
        }
    }).sort((a: any, b: any) => {
        // Sort by avg score descending
        if (a.avgScore === null && b.avgScore === null) return 0
        if (a.avgScore === null) return 1
        if (b.avgScore === null) return -1
        return b.avgScore - a.avgScore
    })

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href={`/teacher/class/${cohortId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Unit {unit.order_index + 1}: {unit.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        Class: {cohort.name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests in Unit</CardTitle>
                        <FileText className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tests?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Unit Score</CardTitle>
                        <Target className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {attempts.length > 0 
                                ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length) + '%' 
                                : 'N/A'
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student Performance List</CardTitle>
                    <CardDescription>
                        Test scores for all students in this class for {unit.title}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {students.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No students enrolled in this class.</p>
                    ) : tests?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No tests available for this unit yet.</p>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        {tests?.map((test: any) => (
                                            <TableHead key={test.id} className="text-center">
                                                {test.title}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right">Unit Average</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentPerformance.map((student: any) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <div className="font-medium">{student.name}</div>
                                                <div className="text-sm text-muted-foreground">{student.email}</div>
                                            </TableCell>
                                            
                                            {student.testScores.map((ts: any, idx: number) => (
                                                <TableCell key={idx} className="text-center">
                                                    {ts === null ? (
                                                        <span className="text-muted-foreground text-sm">Not Taken</span>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="font-semibold">{ts.bestScore}%</span>
                                                            <Badge variant={ts.passed ? "default" : "destructive"} className="text-[10px] h-4 px-1">
                                                                {ts.passed ? "Passed" : "Failed"}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}

                                            <TableCell className="text-right">
                                                {student.avgScore !== null ? (
                                                    <span className="font-bold text-lg">{student.avgScore}%</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
