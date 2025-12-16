import { checkAdmin } from "@/lib/check-role"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, GraduationCap, Shield } from "lucide-react"
import Link from "next/link"
import { CreateTeacherDialog } from "@/components/admin/create-teacher-dialog"
import { DeleteTeacherButton } from "@/components/admin/delete-teacher-button"

export default async function AdminUsersPage() {
    await checkAdmin()

    const supabase = await createClient()

    // Get all teachers
    const { data: teachers } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false })

    // Get all students
    const { data: students } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(20)

    // Get admins
    const { data: admins } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage teachers, students, and roles
                        </p>
                    </div>
                </div>
                <CreateTeacherDialog />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teachers?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{admins?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Admin Users */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle>Administrators</CardTitle>
                    </div>
                    <CardDescription>Users with full platform access</CardDescription>
                </CardHeader>
                <CardContent>
                    {!admins || admins.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No admins found</p>
                    ) : (
                        <div className="space-y-2">
                            {admins.map((admin) => (
                                <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                    <div>
                                        <p className="font-medium">{admin.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                                    </div>
                                    <Badge variant="default">Admin</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Teachers */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        <CardTitle>Teachers</CardTitle>
                    </div>
                    <CardDescription>Instructors managing classes</CardDescription>
                </CardHeader>
                <CardContent>
                    {!teachers || teachers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No teachers yet</p>
                            <CreateTeacherDialog />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {teachers.map((teacher) => (
                                <div key={teacher.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                    <div>
                                        <p className="font-medium">{teacher.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Joined {new Date(teacher.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Teacher</Badge>
                                        <DeleteTeacherButton userId={teacher.id} userName={teacher.full_name} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Students */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Students</CardTitle>
                    </div>
                    <CardDescription>Recently registered students (showing 20)</CardDescription>
                </CardHeader>
                <CardContent>
                    {!students || students.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No students yet</p>
                    ) : (
                        <div className="space-y-2">
                            {students.map((student) => (
                                <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                    <div>
                                        <p className="font-medium">{student.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{student.email}</p>
                                    </div>
                                    <Badge variant="outline">Student</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
