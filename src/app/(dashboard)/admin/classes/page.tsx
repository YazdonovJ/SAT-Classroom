import { checkAdmin } from "@/lib/check-role"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { DeleteClassButton } from "@/components/admin/delete-class-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminClassesPage() {
    await checkAdmin()

    const supabase = await createClient()

    // Get all cohorts with course names
    const { data: cohorts } = await supabase
        .from('cohorts')
        .select('*, courses(title)')
        .order('created_at', { ascending: false })

    // Get teacher info for each cohort
    // Ideally use a join, but for MVP separate queries or Promise.all if needed
    // However, cohort_teachers links cohorts <-> users
    const classesWithDetails = await Promise.all((cohorts || []).map(async (cohort) => {
        // Get Teacher
        const { data: teacherLink } = await supabase
            .from('cohort_teachers')
            .select('users(full_name, email)')
            .eq('cohort_id', cohort.id)
            .single()

        const teacher = teacherLink?.users as any

        // Get Student Count
        const { count: studentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', cohort.id)

        return {
            ...cohort,
            teacherName: teacher?.full_name || 'No Teacher',
            teacherEmail: teacher?.email || '',
            studentCount: studentCount || 0
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
                        <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage all active classes and assignments
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Active Classes</CardTitle>
                            <CardDescription>
                                Overview of all cohorts, teachers, and student enrollments
                            </CardDescription>
                        </div>
                        <Badge variant="outline">{classesWithDetails.length} Classes</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {classesWithDetails.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No classes found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class Name</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead className="text-center">Students</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classesWithDetails.map((cohort) => (
                                    <TableRow key={cohort.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                                {cohort.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{cohort.courses?.title || 'Unknown Course'}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-medium">{cohort.teacherName}</p>
                                                <p className="text-xs text-muted-foreground">{cohort.teacherEmail}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="gap-1">
                                                <Users className="h-3 w-3" />
                                                {cohort.studentCount}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DeleteClassButton classId={cohort.id} className={cohort.name} />
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
