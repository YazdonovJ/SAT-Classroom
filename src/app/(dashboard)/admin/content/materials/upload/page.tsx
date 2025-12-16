import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { UploadMaterialForm } from "@/components/materials/upload-material-form"
import { checkAdmin } from "@/lib/check-role"

export default async function AdminUploadMaterialPage() {
    await checkAdmin()
    const supabase = await createClient()

    // Fetch all units
    const { data: units } = await supabase
        .from('units')
        .select('*, courses(title)')
        .order('created_at', { ascending: false })

    // Fetch all lessons
    const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false })

    // Enhance units with course titles
    const unitsWithCourse = units?.map(u => ({
        ...u,
        title: `${u.courses?.title} - ${u.title}`
    })) || []

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <Link href="/admin/content/materials">
                <Button variant="ghost">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Materials
                </Button>
            </Link>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Upload Material</h1>
                <p className="text-muted-foreground mt-1">
                    Share PDFs, images, and learning resources
                </p>
            </div>

            <UploadMaterialForm units={unitsWithCourse || []} lessons={lessons || []} redirectPath="/admin/content/materials" />
        </div>
    )
}
