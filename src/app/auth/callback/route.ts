
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            console.log("Auth Callback: OTP verified successfully. Session created.")
            // After exchange, we have a session. Redirect.
            // We might want to check the user's role here and redirect to /teacher or /student?
            // For now, redirect to root which will have middleware or logic to route them.
            redirect(next)
        } else {
            console.error("Auth Callback Error:", error.message)
        }
    }

    // return the user to an error page with some instructions
    redirect('/login?error=auth')
}
