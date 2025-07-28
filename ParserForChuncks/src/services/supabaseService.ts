import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Create Supabase client
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

export { supabase };
export default supabase;
