
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
    const supabase = await createClient()

    let user = null
    try {
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser()
        user = authUser
    } catch (error) {
        // If there's an auth error (like invalid refresh token), redirect to login
        redirect("/login")
    }

    if (!user) {
        redirect("/login")
    }

    // Check role from users table
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'student'

    if (role === 'admin') {
        redirect("/admin")
    }

    if (role === 'teacher' || role === 'owner') {
        redirect("/teacher")
    }

    redirect("/student")
}
