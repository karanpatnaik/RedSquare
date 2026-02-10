
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// On web SSR, window is not defined so AsyncStorage (which uses localStorage) crashes.
// Use a no-op storage during SSR; the real storage kicks in once the client hydrates.
const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

const noopStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isSSR ? noopStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // required for React Native
  },
})
