"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Unlock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UnitControlProps {
    unit: any
    cohortId: string
    isUnlocked: boolean
}

export function UnitControl({ unit, cohortId, isUnlocked }: UnitControlProps) {
    const [loading, setLoading] = useState(false)
    const [unlocked, setUnlocked] = useState(isUnlocked)
    const router = useRouter()
    const supabase = createClient()

    const toggleLock = async () => {
        setLoading(true)
        try {
            // Check if state exists
            const { data: existing } = await supabase
                .from('cohort_unit_state')
                .select('id, is_unlocked')
                .eq('cohort_id', cohortId)
                .eq('unit_id', unit.id)
                .maybeSingle()

            if (existing) {
                // Update existing
                const { error } = await supabase
                    .from('cohort_unit_state')
                    .update({ is_unlocked: !unlocked })
                    .eq('id', existing.id)

                if (error) throw error
            } else {
                // Create new
                const { error } = await supabase
                    .from('cohort_unit_state')
                    .insert({
                        cohort_id: cohortId,
                        unit_id: unit.id,
                        is_unlocked: true
                    })

                if (error) throw error
            }

            setUnlocked(!unlocked)
            toast.success(unlocked ? "Unit locked" : "Unit unlocked!")
            router.refresh()
        } catch (error: any) {
            toast.error("Failed to update unit", {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Badge variant={unlocked ? "default" : "secondary"} className={unlocked ? "bg-green-500" : ""}>
                {unlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                {unlocked ? "Unlocked" : "Locked"}
            </Badge>
            <Button
                variant="outline"
                size="sm"
                onClick={toggleLock}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : unlocked ? (
                    <>
                        <Lock className="h-4 w-4 mr-1" />
                        Lock
                    </>
                ) : (
                    <>
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                    </>
                )}
            </Button>
        </div>
    )
}
