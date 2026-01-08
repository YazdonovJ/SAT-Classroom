'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeacherAnalytics } from "@/app/actions/analytics-actions"
import { TrendingUp, Users, Trophy, BookOpen } from "lucide-react"

interface TeacherAnalyticsTableProps {
    data: TeacherAnalytics[]
}

export function TeacherAnalyticsTable({ data }: TeacherAnalyticsTableProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Teacher Analytics</CardTitle>
                    <CardDescription>Performance metrics for all instructors</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">No teacher data available</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Teacher Analytics</CardTitle>
                        <CardDescription>
                            Weekly activity, completion rates, and student performance
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                        {data.length} Teachers
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead className="text-center">Students</TableHead>
                            <TableHead className="text-center">Weekly Completion</TableHead>
                            <TableHead className="text-center">Avg First Try</TableHead>
                            <TableHead className="text-center">Best Result</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((teacher) => (
                            <TableRow key={teacher.id}>
                                <TableCell>
                                    <div className="font-medium">{teacher.name}</div>
                                    <div className="text-xs text-muted-foreground">{teacher.email}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span>{teacher.totalStudents}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {teacher.totalCohorts} classes
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1 font-medium">
                                            <TrendingUp className="h-3 w-3 text-blue-500" />
                                            <span>{teacher.weeklyTestsTaken}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">tests/student</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        variant={teacher.avgFirstTryScore >= 70 ? "secondary" : "outline"}
                                        className={teacher.avgFirstTryScore >= 70 ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                                    >
                                        {teacher.avgFirstTryScore}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1 font-bold text-orange-600">
                                        <Trophy className="h-3 w-3" />
                                        <span>{teacher.bestScore}%</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
