'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createBrowserClient } from "@supabase/supabase-js" // Use direct JS client for creating user to avoid cookie conflicts

export type CreateUserResponse = {
    success: boolean
    message: string
    user?: any
}

export async function createTeacherAccount(data: any): Promise<CreateUserResponse> {
    const { email, password, fullName } = data

    try {
        // 1. Create the user using the public ANON key (simulating a signup)
        // We use a fresh client instance here so we don't mess with the admin's session
        const tempClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: authData, error: signUpError } = await tempClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        })

        if (signUpError) throw signUpError
        if (!authData.user) throw new Error("Failed to create user account")

        // 2. Promote the user to 'teacher' using the Admin's active session
        const supabase = await createClient() // Use server client which has Admin cookies

        // We use upsert to handle both cases:
        // 1. Trigger already created the user -> Update role
        // 2. Trigger hasn't run yet -> Create user with role
        const { error: updateError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email: email,
                full_name: fullName,
                role: 'teacher'
            })

        if (updateError) {
            console.error("Failed to promote user:", updateError)
            return { success: false, message: `User created but failed to set Teacher role: ${updateError.message}` }
        }

        return { success: true, message: "Teacher account created successfully" }

    } catch (error: any) {
        console.error("Create teacher error:", error)
        return { success: false, message: error.message }
    }
}

export async function deleteUser(userId: string) {
    try {
        const supabase = await createClient()

        // 1. Verify the requester is an admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { success: false, message: "Unauthorized: Could not verify user" }
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || (profile?.role !== 'admin' && profile?.role !== 'owner')) {
            return { success: false, message: "Unauthorized: Only admins can delete users" }
        }

        // 2. Validate Service Role Key
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("ey")) {
            console.error("Invalid Service Role Key format")
            return { success: false, message: "Server misconfiguration: Invalid Service Role Key" }
        }

        // 3. Pre-deletion Cleanup (Manual Cascades)
        const adminSupabase = createAdminClient()

        // a. Unlink created tests (set created_by to null) - Likely cause of FK violation
        const { error: testError } = await adminSupabase
            .from('tests')
            .update({ created_by: null })
            .eq('created_by', userId)

        if (testError) {
            console.error("Failed to unlink tests:", testError)
            // Continue anyway? Or fail? Unlinking is better validation than notifications.
            // If this fails, the deleteUser below will likely fail with FK violation anyway.
        }

        // b. Delete notifications (Best effort - table might not exist)
        const { error: notifError } = await adminSupabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)

        if (notifError) {
            console.error("Multimedia cleanup warning (notifications):", notifError.message)
            // Ignore error and proceed
        }

        // c. Delete public user profile (Manual Cascade for public.users -> auth.users)
        // This is crucial because public.users likely references auth.users without ON DELETE CASCADE
        const { error: profileDeleteError } = await adminSupabase
            .from('users')
            .delete()
            .eq('id', userId)

        if (profileDeleteError) {
            console.error("Failed to delete public profile:", profileDeleteError)
            return { success: false, message: "Failed to cleanup public profile" }
        }

        // 4. Delete the user using Admin Client (Service Role)
        const { error } = await adminSupabase.auth.admin.deleteUser(userId)

        if (error) {
            console.error("Supabase Admin Delete Error:", error)
            return { success: false, message: error.message || "Failed to delete user" }
        }

        return { success: true, message: "User deleted successfully" }
    } catch (error: any) {
        console.error("Delete user exception:", error)
        // Ensure we always return a simple object
        return { success: false, message: error?.message || "An unexpected error occurred" }
    }
}
