import { supabase } from './src/config.js'

// Add columns for profile change requests
const queries = [
  "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_change_requested boolean DEFAULT false",
  "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requested_profile_type text DEFAULT null",
  "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_request_reason text DEFAULT null",
]

for (const q of queries) {
  const { error } = await supabase.rpc('exec_sql', { sql: q }).catch(() => ({ error: { message: 'rpc not available' } }))
  if (error) {
    // Try direct SQL via REST
    const { error: e2 } = await supabase.from('profiles').select('profile_change_requested').limit(1)
    if (e2) console.log('Column missing, add manually in Supabase Dashboard')
    else console.log('Columns already exist')
    break
  }
  console.log('OK:', q.slice(0,60))
}
