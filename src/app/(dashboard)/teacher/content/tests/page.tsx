import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, FileText, Clock, Users, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

export default async function TestsListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch all tests created by this teacher
    // Fetch ALL tests (Central Library)
    const { data: tests } = await supabase
        .from('tests')
        .select(`
            *,
            units(title, courses(title)),
            questions(count)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/teacher/content">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Test Library</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage all your tests and quizzes
                        </p>
                    </div>
                </div>
                <Link href="/teacher/content/create-test">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Test
                    </Button>
                </Link>
            </div>

            {!tests || tests.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground">No tests created yet</p>
                        <Link href="/teacher/content/create-test">
                            <Button className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Test
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tests.map((test) => (
                        <Card key={test.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle>{test.title}</CardTitle>
                                            <Badge variant={test.created_by === user.id ? "default" : "secondary"}>
                                                {test.created_by === user.id ? "My Test" : "Global"}
                                            </Badge>
                                        </div>
                                        <CardDescription className="mt-2">
                                            {test.description || "No description"}
                                        </CardDescription>
                                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                {test.questions?.length || 0} questions
                                            </span>
                                            {test.time_limit_minutes && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {test.time_limit_minutes} min
                                                </span>
                                            )}
                                            <span>
                                                {test.units?.courses?.title} • {test.units?.title}
                                            </span>
                                        </div>
                                    </div>
                                    {test.created_by === user.id && (
                                        <div className="flex items-center gap-2">
                                            <Link href={`/teacher/content/test/${test.id}/edit`}>
                                                <Button variant="outline" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="outline" size="icon" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Created {new Date(test.created_at).toLocaleDateString()}
                                    </div>
                                    <Link href={`/teacher/content/test/${test.id}/analytics`}>
                                        <Button variant="ghost" size="sm">
                                            <Users className="h-4 w-4 mr-2" />
                                            View Analytics
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
