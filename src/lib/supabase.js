import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfabmhxzrpdfensifyzo.supabase.co'
const supabaseAnonKey = 'sb_publishable_cb0eT-ilNybHTXeh4cuMuA_g3zk6l-W'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
