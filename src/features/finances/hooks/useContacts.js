/**
 * useContacts Hook
 * Fetches contacts for facture forms
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export function useContacts(type = null) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContacts() {
      setLoading(true)

      let query = supabase
        .from('contacts')
        .select('id, type, contact_type, company_name, first_name, last_name, delai_paiement')
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (!error && data) {
        setContacts(data)
      }

      setLoading(false)
    }

    loadContacts()
  }, [type])

  return { contacts, loading }
}
