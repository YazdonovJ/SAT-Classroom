import { checkAdmin } from "@/lib/check-role"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminStudentsPage() {
    await checkAdmin()

    const supabase = await createClient()

    // 1. Get all students
    const { data: students } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

    // 2. Enhance with enrollment and performance data
    const studentsWithDetails = await Promise.all((students || []).map(async (student) => {
        // Get Enrolled Classes
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('cohorts(name)')
            .eq('user_id', student.id)

        const classNames = enrollments?.map((e: any) => {
            const cohort = Array.isArray(e.cohorts) ? e.cohorts[0] : e.cohorts
            return cohort?.name
        }).filter(Boolean) || []

        // Get Average Test Score
        const { data: attempts } = await supabase
            .from('test_attempts')
            .select('score')
            .eq('user_id', student.id)

        const avgScore = attempts && attempts.length > 0
            ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length)
            : null

        return {
            ...student,
            classNames,
            avgScore,
            testsTaken: attempts?.length || 0
        }
    }))

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                        <p className="text-muted-foreground mt-1">
                            Detailed analytics and enrollment status for all students
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Students</CardTitle>
                            <CardDescription>
                                List of registered students with their performance metrics
                            </CardDescription>
                        </div>
                        <Badge variant="outline">{studentsWithDetails.length} Students</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {studentsWithDetails.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No students found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Enrolled Classes</TableHead>
                                    <TableHead className="text-center">Tests Taken</TableHead>
                                    <TableHead className="text-center">Average Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentsWithDetails.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <GraduationCap className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{student.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {student.classNames.length > 0 ? (
                                                    student.classNames.map((name: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-sm italic">Not enrolled</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {student.testsTaken}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {student.avgScore !== null ? (
                                                <Badge
                                                    variant={student.avgScore >= 70 ? "secondary" : "destructive"}
                                                    className={student.avgScore >= 70 ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                                                >
                                                    {student.avgScore}%
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
