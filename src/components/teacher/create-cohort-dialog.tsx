
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Sparkles } from "lucide-react"

export function CreateCohortDialog() {
    const [open, setOpen] = useState(false)
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [courseId, setCourseId] = useState("")
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            const fetchCourses = async () => {
                const { data } = await supabase.from('courses').select('*')
                if (data) setCourses(data)
            }
            fetchCourses()
        }
    }, [open, supabase])

    const handleCreate = async () => {
        if (!name || !courseId) {
            toast.error("Please fill in all fields")
            return
        }
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // 1. Create Cohort
            const { data: cohort, error: cohortError } = await supabase
                .from('cohorts')
                .insert({
                    name,
                    course_id: courseId,
                })
                .select()
                .single()

            if (cohortError) throw cohortError

            // 2. Assign Teacher
            const { error: assignError } = await supabase
                .from('cohort_teachers')
                .insert({
                    cohort_id: cohort.id,
                    user_id: user.id
                })

            if (assignError) throw assignError

            toast.success("Class created successfully!", {
                description: `${name} is ready for students.`
            })
            setOpen(false)
            setName("")
            setCourseId("")
            // Force a full page reload to show the new class
            window.location.reload()
        } catch (error: any) {
            toast.error("Failed to create class", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] overflow-hidden border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500" />
                <DialogHeader className="pt-6 px-6">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl">Create New Class</DialogTitle>
                    <DialogDescription>
                        Launch a new learning cohort. You can invite students after creation.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 px-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-foreground/80">Class Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Fall 2025 SAT Prep Group A"
                            className="bg-muted/50 border-0 ring-1 ring-border focus-visible:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="course" className="text-foreground/80">Select Course Material</Label>
                        <Select onValueChange={setCourseId} value={courseId}>
                            <SelectTrigger className="bg-muted/50 border-0 ring-1 ring-border focus:ring-primary/50 font-medium">
                                <SelectValue placeholder="Choose a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        <div className="flex flex-col items-start py-1">
                                            <span className="font-medium">{course.title}</span>
                                            {course.description && (
                                                <span className="text-xs text-muted-foreground">{course.description}</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6 bg-muted/20 pt-4">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading} className="font-semibold">
                        {loading ? "Creating..." : "Create Class"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
