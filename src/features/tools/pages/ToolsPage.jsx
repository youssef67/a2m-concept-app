/**
 * ToolsPage
 * Page outils avec bouton test WhatsApp
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, MessageCircle, ClipboardList } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'

export default function ToolsPage() {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('Bonjour, ceci est un message de test depuis A2M Concepts !')

  const handleSendWhatsApp = () => {
    if (!phoneNumber) {
      alert('Veuillez entrer un numéro de téléphone')
      return
    }

    // Formater le numéro : retirer espaces et ajouter indicatif si absent
    let formattedPhone = phoneNumber.replace(/\D/g, '')

    // Si commence par 0, remplacer par 33
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '33' + formattedPhone.substring(1)
    }

    // Si pas d'indicatif, ajouter 33
    if (formattedPhone.length === 9) {
      formattedPhone = '33' + formattedPhone
    }

    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message)

    // Ouvrir WhatsApp
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank')
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Outils</h1>

          {/* Grille d'outils */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Plots Manager */}
            <div
              onClick={() => navigate('/admin/plotsmanager')}
              className="flex items-center justify-center gap-3 min-h-[80px] bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-primary-500 rounded-lg cursor-pointer transition-all duration-200 p-4"
            >
              <ClipboardList className="w-6 h-6 text-primary-600" />
              <span className="text-lg font-semibold">Plots Manager</span>
            </div>

            {/* Liste de contacts */}
            <div
              onClick={() => navigate('/dashboard/workers')}
              className="flex items-center justify-center gap-3 min-h-[80px] bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-primary-500 rounded-lg cursor-pointer transition-all duration-200 p-4"
            >
              <Users className="w-6 h-6 text-primary-600" />
              <span className="text-lg font-semibold">Liste de contacts</span>
            </div>
          </div>
        </div>

        {/* Test WhatsApp - Masqué temporairement */}
        {false && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Test WhatsApp (wa.me)
            </h2>

            <div className="space-y-4">
              {/* Numéro de téléphone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="06 12 34 56 78 ou +33612345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-base"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format accepté : 0612345678, 06 12 34 56 78, +33612345678
                </p>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                />
              </div>

              {/* Bouton envoyer */}
              <Button
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 min-h-[44px] bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Envoyer via WhatsApp</span>
              </Button>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Comment ça marche :</strong> Ce bouton ouvrira WhatsApp avec le message pré-rempli.
                  Vous devrez juste cliquer sur "Envoyer" dans WhatsApp. 100% gratuit et officiel !
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
