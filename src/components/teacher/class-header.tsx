
"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

interface ClassHeaderProps {
    cohortId: string
    cohortName: string
    courseName: string
}

export function ClassHeader({ cohortId, cohortName, courseName }: ClassHeaderProps) {
    return (
        <div className="flex items-center gap-4">
            <Link href="/teacher">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">{cohortName}</h1>
                <p className="text-muted-foreground mt-1">
                    {courseName}
                </p>
            </div>
            <Button onClick={() => {
                const trigger = document.getElementById(`settings-trigger-${cohortId}`)
                trigger?.click()
            }}>
                <Settings className="h-4 w-4 mr-2" />
                Class Settings
            </Button>
        </div>
    )
}
