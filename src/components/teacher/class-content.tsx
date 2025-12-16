"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useRef } from "react"
import { Users, BookOpen, Copy, Check, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { UnitControl } from "./unit-control"
import Link from "next/link"
import { resetClassCode, removeStudent } from "@/app/actions/cohort-actions"

interface ClassContentProps {
    cohort: any
    students: any[]
    units: any[]
}

export function ClassContent({ cohort, students, units }: ClassContentProps) {
    const [addStudentOpen, setAddStudentOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [studentEmail, setStudentEmail] = useState("")
    const [className, setClassName] = useState(cohort.name)
    const [classCode, setClassCode] = useState<string>("")
    const [codeCopied, setCodeCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Fetch class code
    useEffect(() => {
        const fetchCode = async () => {
            const { data } = await supabase
                .from('cohort_codes')
                .select('code')
                .eq('cohort_id', cohort.id)
                .single()

            if (data) setClassCode(data.code)
        }
        fetchCode()
    }, [cohort.id, supabase])

    const copyClassCode = () => {
        navigator.clipboard.writeText(classCode)
        setCodeCopied(true)
        toast.success("Class code copied!")
        setTimeout(() => setCodeCopied(false), 2000)
    }

    const onResetCode = async () => {
        if (!confirm("Are you sure? The old code will stop working immediately.")) return

        setLoading(true)
        try {
            const result = await resetClassCode(cohort.id)
            if (result.success && result.code) {
                setClassCode(result.code)
                toast.success("Class code reset successfully")
                router.refresh()
            } else {
                throw new Error(result.message)
            }
        } catch (error: any) {
            toast.error("Failed to reset code", { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleAddStudent = async () => {
        if (!studentEmail) {
            toast.error("Please enter student email")
            return
        }

        setLoading(true)
        try {
            toast.success("Student Invitation Instructions", {
                description: `Share the class code ${classCode} with ${studentEmail}. They can join at /student/join`
            })
            setAddStudentOpen(false)
            setStudentEmail("")
        } catch (error: any) {
            toast.error("Failed to add student", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        if (!className.trim()) {
            toast.error("Class name cannot be empty")
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('cohorts')
                .update({ name: className })
                .eq('id', cohort.id)

            if (error) throw error

            toast.success("Class settings updated!")
            setSettingsOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error("Failed to update settings", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClass = async () => {
        if (!confirm(`Are you sure you want to delete "${cohort.name}"? This action cannot be undone.`)) {
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('cohorts')
                .delete()
                .eq('id', cohort.id)

            if (error) throw error

            toast.success("Class deleted successfully")
            router.push('/teacher')
        } catch (error: any) {
            toast.error("Failed to delete class", {
                description: error.message
            })
            setLoading(false)
        }
    }

    return (
        <>
            {/* Class Code Card */}
            <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                    <CardTitle className="text-lg">Class Invitation Code</CardTitle>
                    <CardDescription>
                        Share this code with students to join your class
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 p-4 bg-muted rounded-lg text-center">
                            <span className="text-3xl font-bold font-mono tracking-widest text-primary">
                                {classCode || "------"}
                            </span>
                        </div>
                        <Button size="icon" variant="outline" onClick={copyClassCode}>
                            {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onResetCode}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Reset
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Students can use this code at <code className="bg-muted px-1 rounded">/student/join</code>
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Enrolled Students</CardTitle>
                                <CardDescription>Manage student access to this class</CardDescription>
                            </div>
                            <Button onClick={() => setAddStudentOpen(true)}>Add Student</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No students enrolled yet</p>
                                <p className="text-sm mt-2">Share the class code to invite students</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {students.map((enrollment: any) => (
                                    <Link
                                        key={enrollment.id}
                                        href={`/teacher/class/${cohort.id}/student/${enrollment.user_id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-background hover:shadow-md transition-shadow">
                                            <div className="cursor-pointer flex-1" onClick={() => router.push(`/teacher/class/${cohort.id}/student/${enrollment.user_id}`)}>
                                                <p className="font-medium">{enrollment.users?.full_name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">{enrollment.users?.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">Active</Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                    onClick={async (e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        if (!confirm("Are you sure you want to remove this student?")) return

                                                        setLoading(true)
                                                        try {
                                                            const res = await removeStudent(cohort.id, enrollment.user_id)
                                                            if (res.success) {
                                                                toast.success("Student removed")
                                                                router.refresh()
                                                            } else {
                                                                throw new Error(res.message)
                                                            }
                                                        } catch (err: any) {
                                                            toast.error(err.message)
                                                        } finally {
                                                            setLoading(false)
                                                        }
                                                    }}
                                                >
                                                    <Users className="h-4 w-4" style={{ textDecoration: 'line-through' }} />
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Course Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Course Content</CardTitle>
                        <CardDescription>Manage which units are available to students</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!units || units.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No course units available</p>
                                <p className="text-sm mt-2">This course doesn't have content units yet.</p>
                                <p>Content will be added soon for {cohort.courses?.title || 'this course'}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {units.map((unit: any) => (
                                    <div key={unit.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                        <div>
                                            <p className="font-medium">Unit {unit.order_index + 1}: {unit.title}</p>
                                        </div>
                                        <UnitControl
                                            unit={unit}
                                            cohortId={cohort.id}
                                            isUnlocked={unit.is_unlocked || false}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Student Dialog */}
            <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Student</DialogTitle>
                        <DialogDescription>
                            Share the class code <span className="font-mono font-bold text-primary">{classCode}</span> with your student
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Student Email (for your reference)</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="student@example.com"
                                value={studentEmail}
                                onChange={(e) => setStudentEmail(e.target.value)}
                            />
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">Instructions for student:</p>
                            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                                <li>Sign up at /signup</li>
                                <li>Go to /student/join</li>
                                <li>Enter code: <span className="font-mono font-bold text-primary">{classCode}</span></li>
                            </ol>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddStudentOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={copyClassCode}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Class Settings Dialog */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Class Settings</DialogTitle>
                        <DialogDescription>
                            Manage your class settings and options
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="classname">Class Name</Label>
                            <Input
                                id="classname"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="e.g. Fall 2025 Math"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Course Level</Label>
                            <div className="p-3 rounded-lg border bg-muted/50">
                                <p className="text-sm font-medium">{cohort.courses?.title || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    To change course level, create a new class
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <Button
                                variant="destructive"
                                onClick={handleDeleteClass}
                                disabled={loading}
                                className="w-full"
                            >
                                Delete Class
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSettings} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Expose settings trigger to parent */}
            <button
                onClick={() => setSettingsOpen(true)}
                aria-label="Class settings trigger"
                className="hidden"
                id={`settings-trigger-${cohort.id}`}
            />
        </>
    )
}
