import { checkAdmin } from "@/lib/check-role"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CreateUnitForm } from "@/components/content/create-unit-form"

export default async function AdminCreateUnitPage() {
    await checkAdmin()
    const supabase = await createClient()

    // Fetch courses for the dropdown
    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .order('title')

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <Link href="/admin/content/units">
                <Button variant="ghost">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Units
                </Button>
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Unit</h1>
                <p className="text-muted-foreground mt-1">
                    Add a new unit to a course
                </p>
            </div>

            <div className="max-w-2xl">
                <CreateUnitForm courses={courses || []} />
            </div>
        </div>
    )
}
