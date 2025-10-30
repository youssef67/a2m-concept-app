import React from 'react'
import { useAuth } from '../../../features/auth/hooks/useAuth'

export default function RoleBasedContent({ adminContent, viewerContent }) {
  const { isAdmin } = useAuth()

  return isAdmin ? adminContent : viewerContent
}
