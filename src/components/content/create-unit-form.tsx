"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"

interface CreateUnitFormProps {
    courses: any[]
    redirectPath?: string
}

export function CreateUnitForm({ courses, redirectPath = '/admin/content/units' }: CreateUnitFormProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedCourse, setSelectedCourse] = useState("")
    const [orderIndex, setOrderIndex] = useState(1)
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleSave = async () => {
        if (!title || !selectedCourse) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('units')
                .insert({
                    course_id: selectedCourse,
                    title,
                    description,
                    order_index: orderIndex,
                    is_published: true // Default to published for now
                })

            if (error) throw error

            toast.success("Unit created successfully!")
            router.push(redirectPath)
            router.refresh()
        } catch (error: any) {
            toast.error("Failed to create unit", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Unit Details</CardTitle>
                <CardDescription>
                    Create a new unit to organize lessons
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="course">Course *</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="title">Unit Title *</Label>
                    <Input
                        id="title"
                        placeholder="e.g., Algebra I: Foundations"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="What will students learn in this unit?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="order">Order Index</Label>
                    <Input
                        id="order"
                        type="number"
                        placeholder="1"
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(e.target.value ? parseInt(e.target.value) : 0)}
                        min={1}
                    />
                    <p className="text-xs text-muted-foreground">
                        Controls the order in which units appear to students
                    </p>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Create Unit
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
