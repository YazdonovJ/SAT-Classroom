
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export function StudentView({ enrollment }: { enrollment: any }) {
    const [units, setUnits] = useState<any[]>([])
    const supabase = createClient()

    const fetchContent = async () => {
        // Fetch units and corresponding lock status
        const { data: unitsData } = await supabase
            .from('units')
            .select('*')
            .eq('course_id', enrollment.cohorts.course_id)
            .order('order_index')

        const { data: lockStates } = await supabase
            .from('cohort_unit_state')
            .select('unit_id, is_unlocked')
            .eq('cohort_id', enrollment.cohort_id)

        const merged = unitsData?.map(u => ({
            ...u,
            is_unlocked: lockStates?.find((l: any) => l.unit_id === u.id)?.is_unlocked || false
        })) || []

        setUnits(merged)
    }

    useEffect(() => {
        fetchContent()

        // Realtime subscription
        const channel = supabase
            .channel('public:cohort_unit_state')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cohort_unit_state',
                    filter: `cohort_id=eq.${enrollment.cohort_id}`,
                },
                (payload) => {
                    console.log('Realtime update:', payload)
                    toast.info("Content updated!")
                    fetchContent()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [enrollment.cohort_id, supabase])

    return (
        <div className="grid gap-4">
            {units.map((unit) => (
                <Card key={unit.id} className={unit.is_unlocked ? "" : "opacity-50"}>
                    <CardHeader>
                        <CardTitle>{unit.title} {unit.is_unlocked ? "" : "(Locked)"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {unit.is_unlocked ? (
                            <p>Content is viewable.</p>
                        ) : (
                            <p>This content is currently locked.</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
