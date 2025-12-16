import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function checkAdmin() {
    const supabase = await createClient()
    let user = null
    try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        if (error) throw error
        user = authUser
    } catch (e) {
        // If auth fails, redirect to login
        redirect('/login')
    }

    if (!user) {
        redirect('/login')
    }

    // Get user role from database
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'admin') {
        redirect('/unauthorized')
    }

    return user
}

export async function checkTeacher() {
    const supabase = await createClient()
    let user = null
    try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        if (error) throw error
        user = authUser
    } catch (e) {
        redirect('/login')
    }

    if (!user) {
        redirect('/login')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || (userData.role !== 'teacher' && userData.role !== 'admin')) {
        redirect('/unauthorized')
    }

    return user
}

export async function getUserRole(): Promise<'admin' | 'teacher' | 'student' | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    return (userData?.role as 'admin' | 'teacher' | 'student') || 'student'
}
