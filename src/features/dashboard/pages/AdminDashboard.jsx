import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, AlertTriangle, Calendar, CheckCircle2, TrendingUp, FileText, LogOut } from 'lucide-react'
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
import { getContactDisplayName } from '../../contacts/utils/contactHelpers'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Card from '../../../shared/components/ui/Card'
import Spinner from '../../../shared/components/ui/Spinner'
import Alert from '../../../shared/components/ui/Alert'
import Button from '../../../shared/components/ui/Button'

export default function AdminDashboard() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }
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

  // Calcul des factures clients en retard
  const facturesClientsEnRetard = useMemo(() => {
    if (!factures || factures.length === 0) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return factures
      .filter(f => {
        if (f.type !== 'client' || f.statut !== 'en_attente') return false

        const dateEcheance = new Date(f.date_echeance)
        dateEcheance.setHours(0, 0, 0, 0)

        return dateEcheance < today
      })
      .map(f => {
        const dateEcheance = new Date(f.date_echeance)
        dateEcheance.setHours(0, 0, 0, 0)

        const joursRetard = Math.floor((today - dateEcheance) / (1000 * 60 * 60 * 24))

        return {
          ...f,
          joursRetard
        }
      })
      .sort((a, b) => {
        // Trier par échéance la plus ancienne en premier (plus de jours de retard)
        return new Date(a.date_echeance) - new Date(b.date_echeance)
      })
  }, [factures])

  // Calcul des factures fournisseurs en retard
  const facturesFournisseursEnRetard = useMemo(() => {
    if (!factures || factures.length === 0) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return factures
      .filter(f => {
        if (f.type !== 'fournisseur' || f.statut !== 'en_attente') return false

        const dateEcheance = new Date(f.date_echeance)
        dateEcheance.setHours(0, 0, 0, 0)

        return dateEcheance < today
      })
      .map(f => {
        const dateEcheance = new Date(f.date_echeance)
        dateEcheance.setHours(0, 0, 0, 0)

        const joursRetard = Math.floor((today - dateEcheance) / (1000 * 60 * 60 * 24))

        return {
          ...f,
          joursRetard
        }
      })
      .sort((a, b) => {
        // Trier par échéance la plus ancienne en premier (plus de jours de retard)
        return new Date(a.date_echeance) - new Date(b.date_echeance)
      })
  }, [factures])

  // Calcul des chantiers en retard (finalisation 95% et/ou retenues de garantie)
  const chantiersEnRetard = useMemo(() => {
    if (!chantiers || !factures) return []

    return chantiers
      .filter(chantier => {
        // Doit avoir une date de fin réelle
        if (!chantier.date_fin_reelle) return false

        // Vérifie si finalisation 95% en retard ET non payée
        const hasFinalisationRetard =
          chantier.finalisation_95 &&
          !chantier.finalisation_95_payee &&
          isEcheancePassee(calculateEcheanceFinalisation95(chantier.date_fin_reelle))

        // Vérifie si retenues de garantie en retard ET non payées
        const hasRetenuesRetard =
          chantierHasRetenueGarantie(chantier.id, factures) &&
          !chantier.retenue_garantie_payee &&
          isEcheancePassee(calculateEcheanceRetenues(chantier.date_fin_reelle))

        return hasFinalisationRetard || hasRetenuesRetard
      })
      .map(chantier => {
        const echeanceFinalisation = calculateEcheanceFinalisation95(chantier.date_fin_reelle)
        const echeanceRetenues = calculateEcheanceRetenues(chantier.date_fin_reelle)

        return {
          ...chantier,
          finalisationRetard:
            chantier.finalisation_95 &&
            !chantier.finalisation_95_payee &&
            isEcheancePassee(echeanceFinalisation),
          retenuesRetard:
            chantierHasRetenueGarantie(chantier.id, factures) &&
            !chantier.retenue_garantie_payee &&
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

  // Calcul des 3 dernières factures
  const dernieresFactures = useMemo(() => {
    if (!factures || factures.length === 0) return []

    // Filtrer uniquement les factures clients et prendre les 3 premières
    // Les factures sont déjà triées par date_emission DESC dans le service
    return factures
      .filter(f => f.type === 'client')
      .slice(0, 3)
  }, [factures])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Administrateur
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenue, {profile?.full_name || profile?.email}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] px-3"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </Button>
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

        {/* Section: Vue d'ensemble financière */}
        {!loading && !error && (
          <div className="space-y-4">
            <div className="border-t-4 border-blue-600 bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Vue d&apos;ensemble financière
                </h2>
              </div>
            </div>

            {/* Statistics Cards */}
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
          </div>
        )}

        {/* Section: Factures clients en retard */}
        <div className="space-y-4">
          <div className="border-t-4 border-red-600 bg-red-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Factures clients en retard
              </h2>
            </div>
          </div>

          <Card>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="error">
                Erreur lors du chargement des factures clients en retard.
              </Alert>
            )}

            {/* Empty State - Aucune facture client en retard */}
            {!loading && !error && facturesClientsEnRetard.length === 0 && (
              <div className="flex items-center gap-3 px-4 py-6 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="text-base text-green-800 font-medium">
                  Aucune facture client en retard
                </p>
              </div>
            )}

            {/* List of Factures clients en retard */}
            {!loading && !error && facturesClientsEnRetard.length > 0 && (
              <div className="space-y-3">
                {facturesClientsEnRetard.map(facture => (
                  <div
                    key={facture.id}
                    className="p-4 border border-red-200 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {facture.numero_facture}
                      </h3>
                      <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium">
                        {facture.joursRetard} jour{facture.joursRetard > 1 ? 's' : ''} de retard
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Client :</span>{' '}
                        {getContactDisplayName(facture.contact)}
                      </p>
                      <p>
                        <span className="font-medium">Chantier :</span>{' '}
                        {facture.chantier?.titre || 'Aucun chantier'}
                      </p>
                      <p>
                        <span className="font-medium">Montant :</span>{' '}
                        <span className="text-red-700 font-semibold">{formatCurrency(facture.montant)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Section: Factures fournisseurs en retard */}
        <div className="space-y-4">
          <div className="border-t-4 border-orange-600 bg-orange-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Factures fournisseurs en retard
              </h2>
            </div>
          </div>

          <Card>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="error">
                Erreur lors du chargement des factures fournisseurs en retard.
              </Alert>
            )}

            {/* Empty State - Aucune facture fournisseur en retard */}
            {!loading && !error && facturesFournisseursEnRetard.length === 0 && (
              <div className="flex items-center gap-3 px-4 py-6 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="text-base text-green-800 font-medium">
                  Aucune facture fournisseur en retard
                </p>
              </div>
            )}

            {/* List of Factures fournisseurs en retard */}
            {!loading && !error && facturesFournisseursEnRetard.length > 0 && (
              <div className="space-y-3">
                {facturesFournisseursEnRetard.map(facture => (
                  <div
                    key={facture.id}
                    className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {facture.numero_facture}
                      </h3>
                      <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm font-medium">
                        {facture.joursRetard} jour{facture.joursRetard > 1 ? 's' : ''} de retard
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Fournisseur :</span>{' '}
                        {getContactDisplayName(facture.contact)}
                      </p>
                      <p>
                        <span className="font-medium">Chantier :</span>{' '}
                        {facture.chantier?.titre || 'Aucun chantier'}
                      </p>
                      <p>
                        <span className="font-medium">Montant :</span>{' '}
                        <span className="text-orange-700 font-semibold">{formatCurrency(facture.montant)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Section: Chantiers en retard */}
        <div className="space-y-4">
          <div className="border-t-4 border-red-600 bg-red-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                RG et finalisation 95% en retard
              </h2>
            </div>
          </div>

          <Card>

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
        </div>

        {/* Section: Dernières factures */}
        <div className="space-y-4">
          <div className="border-t-4 border-blue-600 bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Dernières factures clients
              </h2>
            </div>
          </div>

          <Card>
            {/* Empty State */}
            {dernieresFactures.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                Aucune facture disponible
              </div>
            )}

            {/* Liste des dernières factures */}
            {dernieresFactures.length > 0 && (
              <div className="space-y-3">
                {dernieresFactures.map(facture => (
                  <div
                    key={facture.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Numéro de facture - mis en avant */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {facture.numero_facture}
                      </h3>
                      <span className="text-lg font-semibold text-blue-600">
                        {formatCurrency(facture.montant)}
                      </span>
                    </div>

                    {/* Informations facture */}
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Client :</span>{' '}
                        {getContactDisplayName(facture.contact)}
                      </p>
                      <p>
                        <span className="font-medium">Chantier :</span>{' '}
                        {facture.chantier?.titre || 'Aucun chantier'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
