import { checkAdmin } from "@/lib/check-role"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, ArrowLeft, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { DeleteUnitButton } from "@/components/admin/delete-unit-button"

export default async function AdminUnitsPage() {
    await checkAdmin()
    const supabase = await createClient()

    // Fetch units with course details
    const { data: units } = await supabase
        .from('units')
        .select('*, courses(title)')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-muted/20 p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/content">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Manage Units</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage course units
                    </p>
                </div>
                <Link href="/admin/content/units/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Unit
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6">
                {!units || units.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <p className="text-lg font-medium mb-2">No units found</p>
                            <p className="mb-4">Create your first unit to get started</p>
                            <Link href="/admin/content/units/create">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Unit
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    units.map((unit) => (
                        <Card key={unit.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-center justify-between p-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold">{unit.title}</h3>
                                            <Badge variant="outline">{unit.courses?.title}</Badge>
                                        </div>
                                        <p className="text-muted-foreground">
                                            {unit.description || "No description provided"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <DeleteUnitButton unitId={unit.id} unitTitle={unit.title} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
