/**
 * Supabase Edge Function: send-finance-notification
 *
 * Sends email notifications for financial actions in A2M Concepts app
 * - Payment notifications (full/partial)
 * - Invoice creation
 * - Invoice deletion
 *
 * All emails sent to: contact@a2m-concept.com (internal notifications only)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Types
interface Contact {
  company_name?: string
  first_name?: string
  last_name?: string
}

interface Facture {
  numero_facture: string
  montant: number
  date_emission: string
  date_echeance?: string
  statut: string
  type?: string
  contact: Contact
}

interface Payment {
  montant: number
  date_paiement: string
  reference?: string
}

interface NotificationRequest {
  type: 'payment_full' | 'payment_partial' | 'invoice_created' | 'invoice_deleted'
  facture: Facture
  payment?: Payment
  montant_restant?: number
}

/**
 * Get contact display name (company or individual)
 */
function getContactName(contact: Contact): string {
  if (contact.company_name) {
    return contact.company_name
  }
  if (contact.first_name || contact.last_name) {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
  }
  return 'Contact inconnu'
}

/**
 * Format currency (€1,234.56)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

/**
 * Format date (31/10/2025)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

/**
 * Get email subject based on notification type
 */
function getSubject(type: string, facture: Facture): string {
  switch (type) {
    case 'payment_full':
      return `✓ Paiement total - ${facture.numero_facture}`
    case 'payment_partial':
      return `⚠ Paiement partiel - ${facture.numero_facture}`
    case 'invoice_created':
      return `📄 Nouvelle facture - ${facture.numero_facture}`
    case 'invoice_deleted':
      return `🗑 Facture supprimée - ${facture.numero_facture}`
    default:
      return `Notification - ${facture.numero_facture}`
  }
}

/**
 * Generate HTML email template
 */
function getEmailHTML(req: NotificationRequest): string {
  const { type, facture, payment, montant_restant } = req
  const contactName = getContactName(facture.contact)
  const factureType = facture.type === 'client' ? 'Client' : 'Fournisseur'

  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #f7f7f7; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
  `

  const footer = `
      </div>
      <div style="text-align: center; color: #888; font-size: 12px; margin-top: 24px;">
        <p>A2M Concepts - Notification automatique</p>
      </div>
    </div>
  `

  let content = ''

  switch (type) {
    case 'payment_full':
      content = `
        <h2 style="color: #10b981; margin-top: 0;">✓ Paiement total enregistré</h2>
        <div style="background-color: white; padding: 16px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 8px 0;"><strong>Facture :</strong> ${facture.numero_facture}</p>
          <p style="margin: 8px 0;"><strong>Contact :</strong> ${contactName}</p>
          <p style="margin: 8px 0;"><strong>Montant :</strong> ${formatCurrency(facture.montant)}</p>
          ${payment ? `<p style="margin: 8px 0;"><strong>Date :</strong> ${formatDate(payment.date_paiement)}</p>` : ''}
          ${payment?.reference ? `<p style="margin: 8px 0;"><strong>Référence :</strong> ${payment.reference}</p>` : ''}
        </div>
        <div style="background-color: #d1fae5; padding: 12px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 0; color: #065f46;"><strong>Statut : Payée ✓</strong></p>
        </div>
      `
      break

    case 'payment_partial':
      content = `
        <h2 style="color: #f59e0b; margin-top: 0;">⚠ Paiement partiel enregistré</h2>
        <div style="background-color: white; padding: 16px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 8px 0;"><strong>Facture :</strong> ${facture.numero_facture}</p>
          <p style="margin: 8px 0;"><strong>Contact :</strong> ${contactName}</p>
          ${payment ? `<p style="margin: 8px 0;"><strong>Montant payé :</strong> <span style="color: #10b981;">${formatCurrency(payment.montant)}</span></p>` : ''}
          <p style="margin: 8px 0;"><strong>Total facture :</strong> ${formatCurrency(facture.montant)}</p>
          ${montant_restant !== undefined ? `<p style="margin: 8px 0;"><strong>Reste à payer :</strong> <span style="color: #f59e0b;">${formatCurrency(montant_restant)}</span></p>` : ''}
          ${payment ? `<p style="margin: 8px 0;"><strong>Date :</strong> ${formatDate(payment.date_paiement)}</p>` : ''}
          ${payment?.reference ? `<p style="margin: 8px 0;"><strong>Référence :</strong> ${payment.reference}</p>` : ''}
        </div>
        <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 0; color: #92400e;"><strong>Statut : Partiellement payée</strong></p>
        </div>
      `
      break

    case 'invoice_created':
      content = `
        <h2 style="color: #3b82f6; margin-top: 0;">📄 Nouvelle facture créée</h2>
        <div style="background-color: white; padding: 16px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 8px 0;"><strong>Numéro :</strong> ${facture.numero_facture}</p>
          <p style="margin: 8px 0;"><strong>Contact :</strong> ${contactName}</p>
          <p style="margin: 8px 0;"><strong>Type :</strong> ${factureType}</p>
          <p style="margin: 8px 0;"><strong>Montant :</strong> ${formatCurrency(facture.montant)}</p>
          <p style="margin: 8px 0;"><strong>Émission :</strong> ${formatDate(facture.date_emission)}</p>
          ${facture.date_echeance ? `<p style="margin: 8px 0;"><strong>Échéance :</strong> ${formatDate(facture.date_echeance)}</p>` : ''}
        </div>
        <div style="background-color: #dbeafe; padding: 12px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 0; color: #1e40af;"><strong>Statut : ${facture.statut === 'en_attente' ? 'En attente' : facture.statut}</strong></p>
        </div>
      `
      break

    case 'invoice_deleted':
      content = `
        <h2 style="color: #ef4444; margin-top: 0;">🗑 Facture supprimée</h2>
        <div style="background-color: white; padding: 16px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 8px 0;"><strong>Numéro :</strong> ${facture.numero_facture}</p>
          <p style="margin: 8px 0;"><strong>Contact :</strong> ${contactName}</p>
          <p style="margin: 8px 0;"><strong>Montant :</strong> ${formatCurrency(facture.montant)}</p>
        </div>
        <div style="background-color: #fee2e2; padding: 12px; border-radius: 6px; margin-top: 16px;">
          <p style="margin: 0; color: #991b1b;"><strong>Action : Suppression</strong></p>
        </div>
      `
      break
  }

  return baseStyle + content + footer
}

/**
 * Main handler
 */
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Get environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const NOTIFICATION_EMAIL = Deno.env.get('NOTIFICATION_EMAIL') || 'contact@a2m-concept.com'

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Parse request body
    const notificationData: NotificationRequest = await req.json()

    // Validate required fields
    if (!notificationData.type || !notificationData.facture) {
      throw new Error('Missing required fields: type and facture')
    }

    // Generate email content
    const subject = getSubject(notificationData.type, notificationData.facture)
    const html = getEmailHTML(notificationData)

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: `A2M Concepts <${NOTIFICATION_EMAIL}>`,
        to: [NOTIFICATION_EMAIL],
        subject: subject,
        html: html
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      throw new Error(`Resend API error: ${resendData.message || 'Unknown error'}`)
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: resendData.id
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)

    // Error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500
      }
    )
  }
})
