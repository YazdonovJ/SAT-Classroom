import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GettingStartedPage() {
    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <Link href="/help">
                <Button variant="ghost">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Help
                </Button>
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Getting Started</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome to the Digital SAT Classroom platform!
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>What is Digital SAT Classroom?</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                    <p>
                        Digital SAT Classroom is a comprehensive platform designed to help teachers manage SAT preparation
                        classes and students track their learning progress. The platform provides:
                    </p>
                    <ul>
                        <li>Class management for teachers</li>
                        <li>Content delivery and control</li>
                        <li>Progress tracking for students</li>
                        <li>Analytics and reporting</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>For Teachers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-medium mb-2">1. Create Your First Class</h3>
                        <p className="text-sm text-muted-foreground">
                            From your dashboard, click "Create Class", select a course level (Foundation, Pre SAT, or Advanced),
                            and give your class a name.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">2. Share Your Class Code</h3>
                        <p className="text-sm text-muted-foreground">
                            After creating a class, you'll receive a 6-character code. Share this with your students so they can join.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">3. Manage Content</h3>
                        <p className="text-sm text-muted-foreground">
                            Unlock or lock units to control what students can access. Track their progress from the analytics dashboard.
                        </p >
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>For Students</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-medium mb-2">1. Join a Class</h3>
                        <p className="text-sm text-muted-foreground">
                            Get a class code from your teacher, go to "Join Class", and enter the code to enroll.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">2. Access Lessons</h3>
                        <p className="text-sm text-muted-foreground">
                            Once your teacher unlocks content, click "Start Learning" on any available unit to begin.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-medium mb-2">3. Track Progress</h3>
                        <p className="text-sm text-muted-foreground">
                            Your dashboard shows your overall progress and which units are available.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
