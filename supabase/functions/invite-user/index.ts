
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Authenticate user
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { email, org_id, role, cohort_id } = await req.json()

        // TODO: Verify user has permission to invite to this org (e.g. is owner/admin)
        // For MVP, we'll assume RLS on the table insertion might handle some, 
        // but typically we need a service_role client to create the actual invite or auth user.

        // Logic: 
        // 1. Check if user exists? If not, invite via auth.admin.inviteUserByEmail (needs service role)
        // 2. Add to org_members
        // 3. Add to enrollments if cohort_id present

        // Detailed implementation omitted for brevity in MVP step, but structure is here.

        return new Response(JSON.stringify({ message: 'Invite processed (stub)' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
