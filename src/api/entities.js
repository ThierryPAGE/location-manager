import { supabase } from './supabaseClient'

// Mapping des noms de champs Base44 → colonnes Supabase
const FIELD_MAP = {
  created_date: 'created_at',
}

const parseSort = (sort) => {
  if (!sort) return { column: 'created_at', ascending: false }
  const desc = sort.startsWith('-')
  const rawField = desc ? sort.slice(1) : sort
  const column = FIELD_MAP[rawField] || rawField
  return { column, ascending: !desc }
}

const createEntity = (tableName) => ({
  list: async (sort) => {
    const { column, ascending } = parseSort(sort)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(column, { ascending })
    if (error) throw error
    return data
  },

  create: async (input) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from(tableName)
      .insert({ ...input, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id, input) => {
    // Exclure user_id des updates pour éviter les violations RLS
    const { user_id, ...updateData } = input
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
    if (error) throw error
  },
})

// ============================================================
// Auth (remplace base44.auth)
// ============================================================
const Auth = {
  me: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw authError || new Error('Non authentifié')

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || '',
      owner_phone: profile?.owner_phone || '',
      owner_address: profile?.owner_address || '',
      owner_postal_code: profile?.owner_postal_code || '',
      owner_city: profile?.owner_city || '',
    }
  },

  updateMe: async (updates) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { full_name, owner_phone, owner_address, owner_postal_code, owner_city } = updates
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, full_name, owner_phone, owner_address, owner_postal_code, owner_city })
    if (error) throw error
  },

  logout: async () => {
    await supabase.auth.signOut()
  },
}

// ============================================================
// Integrations (remplace base44.integrations.Core)
// ============================================================
const Integrations = {
  Core: {
    SendEmail: async ({ to, subject, body }) => {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, body },
      })
      if (error) throw error
    },

    InvokeLLM: async ({ prompt, response_json_schema }) => {
      const { data, error } = await supabase.functions.invoke('invoke-llm', {
        body: { prompt, response_json_schema },
      })
      if (error) throw error
      return data
    },
  },
}

// ============================================================
// Export compatible avec l'API Base44 (import drop-in)
// Seul l'import change : '@/api/base44Client' → '@/api/entities'
// ============================================================
export const base44 = {
  entities: {
    Booking: createEntity('bookings'),
    Property: createEntity('properties'),
    Option: createEntity('options'),
    ContractTemplate: createEntity('contract_templates'),
    PersonalBooking: createEntity('personal_bookings'),
  },
  auth: Auth,
  integrations: Integrations,
}
