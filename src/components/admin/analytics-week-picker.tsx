"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AnalyticsWeekPicker() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Generate last 12 weeks options
    const generateWeeks = () => {
        const weeks = []
        const today = new Date()
        // Adjust to start of current week (Monday)
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
        const currentMonday = new Date(today.setDate(diff))

        for (let i = 0; i < 12; i++) {
            const start = new Date(currentMonday)
            start.setDate(start.getDate() - (i * 7))

            const end = new Date(start)
            end.setDate(end.getDate() + 6)

            const value = start.toISOString().split('T')[0]
            const label = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

            weeks.push({ value, label, start, end })
        }
        return weeks
    }

    const weeks = generateWeeks()
    const [selectedWeek, setSelectedWeek] = useState<string>(searchParams.get('startDate') || weeks[0].value)

    const handleValueChange = (value: string) => {
        setSelectedWeek(value)
        const params = new URLSearchParams(searchParams.toString())

        if (value) {
            params.set('startDate', value)
            const week = weeks.find(w => w.value === value)
            if (week) {
                params.set('endDate', week.end.toISOString().split('T')[0])
            }
        } else {
            params.delete('startDate')
            params.delete('endDate')
        }

        router.push(`?${params.toString()}`)
    }

    return (
        <Select value={selectedWeek} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
                {weeks.map((week) => (
                    <SelectItem key={week.value} value={week.value}>
                        {week.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
