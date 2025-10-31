import React, { useMemo } from 'react'
import { Clock, CheckCircle, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useFactures } from '../../finances/hooks/useFactures'
import { useChantiers } from '../../chantiers/hooks/useChantiers'
import { formatCurrency } from '../../finances/utils/factureHelpers'
import {
  calculateEcheanceFinalisation95,
  calculateEcheanceRetenues,
  isEcheancePassee,
  chantierHasRetenueGarantie,
  formatDate as formatChantierDate,
  getClientDisplayName as getChantierClientName
} from '../../chantiers/utils/chantierHelpers'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Card from '../../../shared/components/ui/Card'
import Spinner from '../../../shared/components/ui/Spinner'
import Alert from '../../../shared/components/ui/Alert'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const { factures, loading, error } = useFactures()
  const { chantiers, loading: chantiersLoading, error: chantiersError } = useChantiers('cloture')

  // Calculs des statistiques
  const stats = useMemo(() => {
    if (!factures || factures.length === 0) {
      return {
        clientsEnAttente: { montant: 0, count: 0 },
        clientsPayes: { montant: 0, count: 0 },
        fournisseursEnAttente: { montant: 0, count: 0 },
        fournisseursPayes: { montant: 0, count: 0 }
      }
    }

    // Factures CLIENTS (exclure annulées)
    const facturesClients = factures.filter(f => f.type === 'client' && f.statut !== 'annulee')
    const clientsEnAttente = facturesClients.filter(f => f.statut === 'en_attente')
    const clientsPayees = facturesClients.filter(f => f.statut === 'payee' || f.statut === 'partiellement_payee')

    // Factures FOURNISSEURS (exclure annulées)
    const facturesFournisseurs = factures.filter(f => f.type === 'fournisseur' && f.statut !== 'annulee')
    const fournisseursEnAttente = facturesFournisseurs.filter(f => f.statut === 'en_attente')
    const fournisseursPayees = facturesFournisseurs.filter(f => f.statut === 'payee' || f.statut === 'partiellement_payee')

    return {
      clientsEnAttente: {
        montant: clientsEnAttente.reduce((sum, f) => sum + parseFloat(f.montant || 0), 0),
        count: clientsEnAttente.length
      },
      clientsPayes: {
        montant: clientsPayees.reduce((sum, f) => sum + parseFloat(f.montant_paye || 0), 0),
        count: clientsPayees.length
      },
      fournisseursEnAttente: {
        montant: fournisseursEnAttente.reduce((sum, f) => sum + parseFloat(f.montant || 0), 0),
        count: fournisseursEnAttente.length
      },
      fournisseursPayes: {
        montant: fournisseursPayees.reduce((sum, f) => sum + parseFloat(f.montant_paye || 0), 0),
        count: fournisseursPayees.length
      }
    }
  }, [factures])

  // Calcul des chantiers en retard (finalisation 95% et/ou retenues de garantie)
  const chantiersEnRetard = useMemo(() => {
    if (!chantiers || !factures) return []

    return chantiers
      .filter(chantier => {
        // Doit avoir une date de fin réelle
        if (!chantier.date_fin_reelle) return false

        // Vérifie si finalisation 95% en retard
        const hasFinalisationRetard =
          chantier.finalisation_95 &&
          isEcheancePassee(calculateEcheanceFinalisation95(chantier.date_fin_reelle))

        // Vérifie si retenues de garantie en retard
        const hasRetenuesRetard =
          chantierHasRetenueGarantie(chantier.id, factures) &&
          isEcheancePassee(calculateEcheanceRetenues(chantier.date_fin_reelle))

        return hasFinalisationRetard || hasRetenuesRetard
      })
      .map(chantier => {
        const echeanceFinalisation = calculateEcheanceFinalisation95(chantier.date_fin_reelle)
        const echeanceRetenues = calculateEcheanceRetenues(chantier.date_fin_reelle)

        return {
          ...chantier,
          finalisationRetard:
            chantier.finalisation_95 && isEcheancePassee(echeanceFinalisation),
          retenuesRetard:
            chantierHasRetenueGarantie(chantier.id, factures) &&
            isEcheancePassee(echeanceRetenues),
          echeanceFinalisation,
          echeanceRetenues
        }
      })
      .sort((a, b) => {
        // Trier par échéance la plus ancienne (plus en retard) en premier
        const dateA = Math.min(
          a.finalisationRetard ? new Date(a.echeanceFinalisation).getTime() : Infinity,
          a.retenuesRetard ? new Date(a.echeanceRetenues).getTime() : Infinity
        )
        const dateB = Math.min(
          b.finalisationRetard ? new Date(b.echeanceFinalisation).getTime() : Infinity,
          b.retenuesRetard ? new Date(b.echeanceRetenues).getTime() : Infinity
        )
        return dateA - dateB
      })
  }, [chantiers, factures])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenue, {profile?.full_name || profile?.email}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="error">
            Erreur lors du chargement des statistiques financières.
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 - Clients À Recevoir */}
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium">Clients - À recevoir</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(stats.clientsEnAttente.montant)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.clientsEnAttente.count} facture{stats.clientsEnAttente.count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 2 - Clients Reçu */}
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium">Clients - Reçu</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(stats.clientsPayes.montant)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.clientsPayes.count} facture{stats.clientsPayes.count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 3 - Fournisseurs À Payer */}
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium">Fournisseurs - À payer</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(stats.fournisseursEnAttente.montant)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.fournisseursEnAttente.count} facture{stats.fournisseursEnAttente.count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>

            {/* Card 4 - Fournisseurs Payé */}
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium">Fournisseurs - Payé</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(stats.fournisseursPayes.montant)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.fournisseursPayes.count} facture{stats.fournisseursPayes.count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Section Chantiers en retard */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Chantiers en retard
            </h2>
          </div>

          {/* Loading State */}
          {chantiersLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          )}

          {/* Error State */}
          {chantiersError && (
            <Alert variant="error">
              Erreur lors du chargement des chantiers en retard.
            </Alert>
          )}

          {/* Empty State - Aucun chantier en retard */}
          {!chantiersLoading && !chantiersError && chantiersEnRetard.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-6 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <p className="text-base text-green-800 font-medium">
                Aucune finalisation ou retenue en retard
              </p>
            </div>
          )}

          {/* List of Chantiers en retard */}
          {!chantiersLoading && !chantiersError && chantiersEnRetard.length > 0 && (
            <div className="space-y-4">
              {chantiersEnRetard.map(chantier => (
                <div
                  key={chantier.id}
                  className="p-4 border border-red-200 bg-red-50 rounded-lg space-y-3"
                >
                  {/* Titre + Client */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {chantier.titre}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getChantierClientName(chantier.client)}
                    </p>
                  </div>

                  {/* Badges de retard */}
                  <div className="space-y-2">
                    {/* Finalisation 95% en retard */}
                    {chantier.finalisationRetard && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-3 py-1 bg-red-600 text-white rounded-full font-medium">
                          Finalisation 95%
                        </span>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Calendar className="w-4 h-4" />
                          <span>Échéance : {formatChantierDate(chantier.echeanceFinalisation)}</span>
                        </div>
                      </div>
                    )}

                    {/* Retenues de garantie en retard */}
                    {chantier.retenuesRetard && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-3 py-1 bg-red-600 text-white rounded-full font-medium">
                          Retenues de garantie
                        </span>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Calendar className="w-4 h-4" />
                          <span>Échéance : {formatChantierDate(chantier.echeanceRetenues)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Profile Information Card */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Informations
          </h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Email :</span> {profile?.email}</p>
            <p><span className="font-medium">Rôle :</span> <span className="capitalize">{profile?.role}</span></p>
            <p><span className="font-medium">Créé le :</span> {new Date(profile?.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
