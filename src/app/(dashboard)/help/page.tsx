import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Users, GraduationCap, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Help & Documentation</h1>
                <p className="text-muted-foreground mt-1">
                    Learn how to use the Digital SAT Classroom platform
                </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/help/getting-started">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary">
                        <CardHeader>
                            <HelpCircle className="h-8 w-8 text-primary mb-2" />
                            <CardTitle>Getting Started</CardTitle>
                            <CardDescription>
                                New to the platform? Start here to learn the basics
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/help/teachers">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
                        <CardHeader>
                            <Users className="h-8 w-8 text-purple-500 mb-2" />
                            <CardTitle>For Teachers</CardTitle>
                            <CardDescription>
                                Create classes, manage students, and track progress
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/help/students">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-indigo-500">
                        <CardHeader>
                            <GraduationCap className="h-8 w-8 text-indigo-500 mb-2" />
                            <CardTitle>For Students</CardTitle>
                            <CardDescription>
                                Join classes, access lessons, and track your learning
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/help/faqs">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
                        <CardHeader>
                            <BookOpen className="h-8 w-8 text-green-500 mb-2" />
                            <CardTitle>FAQs</CardTitle>
                            <CardDescription>
                                Frequently asked questions and answers
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/help/contact">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                        <CardHeader>
                            <HelpCircle className="h-8 w-8 text-orange-500 mb-2" />
                            <CardTitle>Contact Support</CardTitle>
                            <CardDescription>
                                Need help? Get in touch with our support team
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Popular Topics */}
            <Card>
                <CardHeader>
                    <CardTitle>Popular Topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Link href="/help/teachers/creating-classes" className="block p-3 rounded-lg hover:bg-muted transition-colors">
                        <p className="font-medium">How to create a class</p>
                        <p className="text-sm text-muted-foreground">Learn how to set up your first class</p>
                    </Link>
                    <Link href="/help/students/joining-classes" className="block p-3 rounded-lg hover:bg-muted transition-colors">
                        <p className="font-medium">How to join a class</p>
                        <p className="text-sm text-muted-foreground">Use a class code to enroll</p>
                    </Link>
                    <Link href="/help/teachers/unlocking-content" className="block p-3 rounded-lg hover:bg-muted transition-colors">
                        <p className="font-medium">How to unlock content</p>
                        <p className="text-sm text-muted-foreground">Manage unit access for students</p>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
