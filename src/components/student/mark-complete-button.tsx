"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface MarkCompleteButtonProps {
    lessonId: string
    unitId: string
}

export function MarkCompleteButton({ lessonId, unitId }: MarkCompleteButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleMarkComplete = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // For now, just show success and navigate back
            // In a real app, you'd save progress to a lesson_progress table
            toast.success("Lesson completed!", {
                description: "Great job! Keep learning."
            })

            // Navigate back to unit
            router.push(`/student/unit/${unitId}`)
        } catch (error: any) {
            toast.error("Failed to mark complete", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleMarkComplete} disabled={loading}>
            {loading ? "Saving..." : "Mark as Complete"}
            <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
    )
}
