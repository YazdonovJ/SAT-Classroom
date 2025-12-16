
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seedUser() {
    const email = 'jamo1iddingrozniy@gmail.com'
    const password = 'Yazdon_ov1@2006'

    console.log(`Creating user: ${email}`)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error('Error creating user:', error.message)
    } else {
        console.log('User created or already exists:', data.user?.id)
    }
}

seedUser()
