'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ActionResponse = {
    success: boolean
    message: string
    code?: string
}

export async function resetClassCode(cohortId: string): Promise<ActionResponse> {
    const supabase = await createClient()

    try {
        // 1. Verify user is teacher of this cohort (or admin)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        // Check if user is teacher of this cohort
        const { data: isTeacher } = await supabase
            .from('cohort_teachers')
            .select('id')
            .eq('cohort_id', cohortId)
            .eq('user_id', user.id)
            .single()

        // Also check if admin
        const { data: isAdmin } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .eq('role', 'admin')
            .single()

        if (!isTeacher && !isAdmin) {
            throw new Error("Unauthorized: You must be a teacher of this class or an admin")
        }

        // 2. Generate new code
        // Simple 6-char alphanumeric code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars
        let newCode = ''
        for (let i = 0; i < 6; i++) {
            newCode += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        // 3. Update database
        // 3. Update database (Upsert to ensure it exists)
        const { error } = await supabase
            .from('cohort_codes')
            .upsert({ cohort_id: cohortId, code: newCode }, { onConflict: 'cohort_id' })

        if (error) throw error

        revalidatePath(`/teacher/class/${cohortId}`)
        return { success: true, message: "Class code reset successfully", code: newCode }

    } catch (error: any) {
        console.error("Reset code error:", error)
        return { success: false, message: error.message }
    }
}

export async function removeStudent(cohortId: string, userId: string): Promise<ActionResponse> {
    const supabase = await createClient()

    try {
        // 1. Verify user is teacher (policy will handle it, but good to be explicit/safe)
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('cohort_id', cohortId)
            .eq('user_id', userId)

        if (error) throw error

        revalidatePath(`/teacher/class/${cohortId}`)
        return { success: true, message: "Student removed successfully" }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export async function deleteCohort(cohortId: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Verify Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        const { data: userRole } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
            throw new Error("Unauthorized")
        }

        // 2. Delete Cohort (Cascades should handle relationships, but we'll see)
        // Usually better to be explicit if no cascade, but for now direct delete.
        const { error } = await supabase
            .from('cohorts')
            .delete()
            .eq('id', cohortId)

        if (error) throw error

        revalidatePath('/admin/classes')
        return { success: true, message: "Class deleted successfully" }
    } catch (error: any) {
        console.error("Delete cohort error:", error)
        return { success: false, message: error.message }
    }
}
