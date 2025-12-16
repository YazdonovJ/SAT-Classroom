
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seedCourses() {
    // Sign in as owner to pass RLS
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'jamo1iddingrozniy@gmail.com',
        password: 'Yazdon_ov1@2006'
    })

    if (authError) {
        console.error("Auth failed:", authError.message)
        return
    }

    const { data: orgs } = await supabase.from('organizations').select('id').eq('slug', 'my-sat-prep').single()

    if (!orgs) {
        console.error("Org not found. Run setup_owner.sql first.")
        return
    }

    const orgId = orgs.id

    const courses = [
        { title: 'Foundation', description: 'Introductory SAT preparation', org_id: orgId },
        { title: 'Pre SAT', description: 'Intermediate SAT preparation', org_id: orgId },
        { title: 'Advanced', description: 'Advanced SAT preparation', org_id: orgId }
    ]

    // First, delete old courses to avoid duplicates
    await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    for (const c of courses) {
        const { error } = await supabase.from('courses').insert(c).select()
        if (error) console.error('Error creating course:', c.title, error.message)
        else console.log('Created course:', c.title)
    }
}

seedCourses()
