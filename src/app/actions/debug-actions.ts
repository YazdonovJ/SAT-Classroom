'use server'

import { createClient } from "@/lib/supabase/server"

export async function verifyCode(code: string) {
    const supabase = await createClient()

    // 1. Check if ANY code exists (is DB empty?)
    const { count: totalResponse } = await supabase
        .from('cohort_codes')
        .select('*', { count: 'exact', head: true })

    // 2. Check for specific code
    const { data, error } = await supabase
        .from('cohort_codes')
        .select('cohort_id')
        .eq('code', code)
        .single()

    if (data) {
        return {
            exists: true,
            message: "Code exists in DB (Server verified).",
            totalRows: totalResponse
        }
    } else {
        return {
            exists: false,
            message: error ? error.message : "Code not found checks",
            totalRows: totalResponse
        }
    }
}
