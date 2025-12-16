
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Users, Calendar, BookOpen, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function CohortManager({ cohorts }: { cohorts: any[] }) {
    const router = useRouter()

    const handleManageClass = (cohortId: string) => {
        router.push(`/teacher/class/${cohortId}`)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cohorts.map((cohort: any) => (
                <Card
                    key={cohort.id}
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary bg-gradient-to-br from-white to-purple-50/20 dark:from-gray-900 dark:to-purple-900/10"
                    onClick={() => handleManageClass(cohort.id)}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                    {cohort.name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 text-xs">
                                    <BookOpen className="h-3 w-3" />
                                    {cohort.courses?.title || 'No course'}
                                </CardDescription>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>0 students</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                Active
                            </Badge>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleManageClass(cohort.id)
                            }}
                        >
                            <Settings className="h-3 w-3 mr-2" />
                            Manage Class
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
