
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://bvmtcgnmejoyuzmgrdap.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bXRjZ25tZWpveXV6bWdyZGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzQxNDEsImV4cCI6MjA3NDg1MDE0MX0.XH5Oz_WMYVer4FJziHsO1GtVhiDeuEMY0s3Vm6mpPdk"               // copy anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // required for React Native
  },
})
