import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eptqpsrctxufvaqioyws.supabase.co'
const supabaseKey = 'sb_publishable_IdSBDstUZx9-M1ml84YpuQ_UD4Y0NxX'

export const supabase = createClient(supabaseUrl, supabaseKey)
