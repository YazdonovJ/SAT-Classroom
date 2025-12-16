import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield, Settings } from "lucide-react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch user profile
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // Count enrollments for students or cohorts for teachers
    const { data: enrollments, count: enrollmentCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const { data: cohorts, count: cohortCount } = await supabase
        .from('cohort_teachers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const role = profile?.role || 'student'
    const isTeacher = role === 'teacher'
    const isAdmin = role === 'admin'

    const joinDate = new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    })

    const getRoleBadge = () => {
        if (isAdmin) return <Badge variant="default" className="text-base px-4 py-2 bg-red-600 hover:bg-red-700"><Shield className="h-4 w-4 mr-2" />Admin</Badge>
        if (isTeacher) return <Badge variant="secondary" className="text-base px-4 py-2"><Shield className="h-4 w-4 mr-2" />Teacher</Badge>
        return <Badge variant="outline" className="text-base px-4 py-2"><User className="h-4 w-4 mr-2" />Student</Badge>
    }

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account settings and preferences
                    </p>
                </div>
                {getRoleBadge()}
            </div>

            {/* Profile Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your personal details and account status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar and Name */}
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                Joined {joinDate}
                            </p>
                        </div>
                        <div className="space-x-2">
                            <EditProfileDialog profile={profile} />
                            <ChangePasswordDialog />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-3xl font-bold text-primary">
                                {isTeacher ? cohortCount : enrollmentCount}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isTeacher ? 'Classes Created' : 'Classes Enrolled'}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-3xl font-bold text-purple-500">0</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isTeacher ? 'Total Students' : 'Lessons Completed'}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-3xl font-bold text-indigo-500">0</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isTeacher ? 'Units Created' : 'Study Hours'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">
                                Receive updates about class activities
                            </p>
                        </div>
                        <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-muted-foreground">
                                Purple theme (default)
                            </p>
                        </div>
                        <Badge variant="outline">Purple</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <p className="font-medium">Password</p>
                            <p className="text-sm text-muted-foreground">
                                Last changed recently
                            </p>
                        </div>
                        <ChangePasswordDialog />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">
                                Add an extra layer of security
                            </p>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
