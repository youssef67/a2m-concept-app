/**
 * Email Notification Service
 *
 * Wrapper service to send email notifications for financial actions
 * via Supabase Edge Function
 *
 * All notifications are sent asynchronously and non-blocking
 * Failures are logged silently without disrupting user operations
 */

import { supabase } from '../../../lib/supabaseClient'
import { logger } from '../../../shared/utils/logger'

/**
 * Get display value for invoice number
 * For supplier invoices, the number may be null if not provided
 * @param {string|null} numeroFacture - Invoice number
 * @returns {string} Display value
 */
function getNumeroFactureDisplay(numeroFacture) {
  return numeroFacture || 'Non renseigné'
}

/**
 * Send payment notification (full or partial)
 *
 * @param {Object} facture - Invoice data with contact info
 * @param {Object} payment - Payment data
 * @param {boolean} isFullPayment - True if payment covers full amount
 * @returns {Promise<Object>} Result with success status
 */
export async function sendPaymentNotification(facture, payment, isFullPayment) {
  try {
    const type = isFullPayment ? 'payment_full' : 'payment_partial'

    // Calculate remaining amount for partial payments
    const montantRestant = isFullPayment
      ? 0
      : (facture.montant - (facture.montant_paye || 0))

    const { data, error } = await supabase.functions.invoke('send-finance-notification', {
      body: {
        type,
        facture: {
          numero_facture: getNumeroFactureDisplay(facture.numero_facture),
          montant: facture.montant,
          date_emission: facture.date_emission,
          date_echeance: facture.date_echeance,
          statut: facture.statut,
          type: facture.type,
          contact: {
            company_name: facture.contact?.company_name,
            first_name: facture.contact?.first_name,
            last_name: facture.contact?.last_name
          }
        },
        payment: {
          montant: payment.montant,
          date_paiement: payment.date_paiement,
          reference: payment.reference
        },
        montant_restant: montantRestant
      }
    })

    if (error) {
      logger.error('[Email Notification] Payment email failed:', error)
      return { success: false, error }
    }

    logger.log('[Email Notification] Payment email sent:', data)
    return { success: true, data }

  } catch (error) {
    logger.error('[Email Notification] Payment email exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send invoice creation notification
 *
 * @param {Object} facture - Invoice data with contact info
 * @returns {Promise<Object>} Result with success status
 */
export async function sendInvoiceCreatedNotification(facture) {
  try {
    const { data, error } = await supabase.functions.invoke('send-finance-notification', {
      body: {
        type: 'invoice_created',
        facture: {
          numero_facture: getNumeroFactureDisplay(facture.numero_facture),
          montant: facture.montant,
          date_emission: facture.date_emission,
          date_echeance: facture.date_echeance,
          statut: facture.statut,
          type: facture.type,
          contact: {
            company_name: facture.contact?.company_name,
            first_name: facture.contact?.first_name,
            last_name: facture.contact?.last_name
          }
        }
      }
    })

    if (error) {
      logger.error('[Email Notification] Invoice creation email failed:', error)
      return { success: false, error }
    }

    logger.log('[Email Notification] Invoice creation email sent:', data)
    return { success: true, data }

  } catch (error) {
    logger.error('[Email Notification] Invoice creation email exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send invoice deletion notification
 *
 * @param {Object} facture - Invoice data with contact info (must be fetched before deletion)
 * @returns {Promise<Object>} Result with success status
 */
export async function sendInvoiceDeletedNotification(facture) {
  try {
    const { data, error } = await supabase.functions.invoke('send-finance-notification', {
      body: {
        type: 'invoice_deleted',
        facture: {
          numero_facture: getNumeroFactureDisplay(facture.numero_facture),
          montant: facture.montant,
          date_emission: facture.date_emission,
          statut: facture.statut,
          type: facture.type,
          contact: {
            company_name: facture.contact?.company_name,
            first_name: facture.contact?.first_name,
            last_name: facture.contact?.last_name
          }
        }
      }
    })

    if (error) {
      logger.error('[Email Notification] Invoice deletion email failed:', error)
      return { success: false, error }
    }

    logger.log('[Email Notification] Invoice deletion email sent:', data)
    return { success: true, data }

  } catch (error) {
    logger.error('[Email Notification] Invoice deletion email exception:', error)
    return { success: false, error: error.message }
  }
}
