'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteUnit(unitId: string) {
    try {
        const supabase = await createClient()

        // 1. Verify Admin/Teacher
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        const { data: userRole } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'teacher' && userRole.role !== 'owner')) {
            throw new Error("Unauthorized")
        }

        // 2. Delete Unit
        const { error } = await supabase
            .from('units')
            .delete()
            .eq('id', unitId)

        if (error) throw error

        revalidatePath('/admin/content/units')
        return { success: true, message: "Unit deleted successfully" }
    } catch (error: any) {
        console.error("Delete unit error:", error)
        return { success: false, message: error.message }
    }
}

export async function deleteTest(testId: string) {
    try {
        const supabase = await createClient()

        // 1. Verify Admin/Teacher
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        const { data: userRole } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'teacher' && userRole.role !== 'owner')) {
            throw new Error("Unauthorized")
        }

        // 2. Delete Test
        const { error } = await supabase
            .from('tests')
            .delete()
            .eq('id', testId)

        if (error) throw error

        revalidatePath('/admin/content/tests')
        // Also revalidate the main content page likely
        revalidatePath('/admin/content')
        return { success: true, message: "Test deleted successfully" }
    } catch (error: any) {
        console.error("Delete test error:", error)
        return { success: false, message: error.message }
    }
}
