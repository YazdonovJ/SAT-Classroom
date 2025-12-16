
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function setOwnerRole() {
    const email = 'jamo1iddingrozniy@gmail.com'

    // 1. Get User ID
    const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers() // Won't work with Anon key usually. 
    // Wait, anon key cannot list users. We have to rely on the user ID we just got or log in.

    // Alternative: Sign in as that user, then look up their ID? No, we need to INSERT into org_members.
    // With RLS, only users can insert their own request or an admin.
    // BUT we established that we don't have service role key.
    // The schema allows "public.org_members" RLS?
    // "create policy "Orgs are viewable by everyone" on public.organizations for select using (true);"
    // We need to insert an org and member.

    // Let's sign in effectively:
    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password: 'Yazdon_ov1@2006'
    })

    if (loginErr || !session) {
        console.error("Login failed for seeding data", loginErr)
        return
    }

    console.log("Logged in as user:", session.user.id)

    // 2. Create Organization
    // Check if org exists?
    const { data: orgs } = await supabase.from('organizations').select('*').limit(1)

    let orgId
    if (orgs && orgs.length > 0) {
        orgId = orgs[0].id
        console.log("Using existing org:", orgId)
    } else {
        const { data: newOrg, error: orgErr } = await supabase
            .from('organizations')
            .insert({ name: 'My SAT Prep', slug: 'my-sat-prep' })
            .select()
            .single()

        if (orgErr) {
            console.error("Org creation failed", orgErr)
            // If RLS prevents this, we are stuck without service key. 
            // Attempting to proceed.
            return
        }
        orgId = newOrg.id
        console.log("Created org:", orgId)
    }

    // 3. Create Org Member (Owner)
    const { error: memberErr } = await supabase
        .from('org_members')
        .upsert({
            org_id: orgId,
            user_id: session.user.id,
            role: 'owner'
        }, { onConflict: 'org_id, user_id' })

    if (memberErr) {
        console.error("Member assignment failed", memberErr)
    } else {
        console.log("Assigned 'owner' role to user.")
    }
}

setOwnerRole()
