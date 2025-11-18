import { createClient } from '@supabase/supabase-js';

// You can get these from your Supabase project settings
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
    const { data, error } = await supabase.auth.signUp({
        email: 'solo@example.com',
        password: 'solo123',
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created successfully:', data);
    }
}

createUser();
