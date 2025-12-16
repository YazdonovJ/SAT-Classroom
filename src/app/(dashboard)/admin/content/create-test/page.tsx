import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CreateTestForm } from "@/components/content/create-test-form"
import { checkAdmin } from "@/lib/check-role"

export default async function AdminCreateTestPage() {
    await checkAdmin()
    const supabase = await createClient()

    // Fetch units - admins can see units from all courses or filter by course if we add that later
    // For now, let's fetch all units from all courses so admin can attach test to any unit

    const { data: units } = await supabase
        .from('units')
        .select('*, courses(title)')
        .order('created_at', { ascending: false })

    // Enhance units with course titles
    const unitsWithCourse = units?.map(u => ({
        ...u,
        title: `${u.courses?.title} - ${u.title}`
    })) || []

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <Link href="/admin/content">
                <Button variant="ghost">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Content
                </Button>
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Test</h1>
                <p className="text-muted-foreground mt-1">
                    Build a new test or quiz for students
                </p>
            </div>

            <CreateTestForm units={unitsWithCourse} redirectPath="/admin/content/tests" />
        </div>
    )
}
