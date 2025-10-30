# EPCT Workflow - Explore, Plan, Code, Test

Tu vas suivre un workflow structuré en 4 phases pour implémenter une nouvelle fonctionnalité dans l'application A2M Concepts.

## ⚠️ WORKFLOW DEV → PROD OBLIGATOIRE

**RÈGLE ABSOLUE :** Toute fonctionnalité suit STRICTEMENT ce cycle :

```
┌─────────────────────────────────────────────────────────────────┐
│  DEV (développement)                                            │
│  └─ Branche : dev ou feature/xxx                               │
│  └─ Base de données : DEV (.env.dev)                           │
│  └─ Code : Développement + tests en local                      │
│  └─ Migration DB : run-migration-dev.sh                        │
├─────────────────────────────────────────────────────────────────┤
│  VALIDATION (en DEV)                                            │
│  └─ Tests manuels complets en DEV                              │
│  └─ Vérification DB en DEV                                     │
│  └─ Commit sur dev                                             │
├─────────────────────────────────────────────────────────────────┤
│  PROD (production)                                              │
│  └─ Branche : prod (merge depuis dev)                          │
│  └─ Base de données : PROD (.env.prod)                         │
│  └─ Migration DB : run-migration-prod.sh                       │
│  └─ Déploiement automatique : Vercel                           │
└─────────────────────────────────────────────────────────────────┘
```

**JAMAIS de développement direct en PROD. TOUJOURS passer par DEV d'abord.**

## Instructions générales

- Suis rigoureusement les 4 phases dans l'ordre : EXPLORE → PLAN → CODE → TEST
- Ne passe JAMAIS à la phase suivante sans avoir terminé la phase en cours
- Arrête-toi OBLIGATOIREMENT après la phase PLAN pour demander validation à l'utilisateur
- Utilise le TodoWrite tool pour tracker ta progression tout au long du workflow
- Respecte TOUTES les conventions définies dans CLAUDE.md (mobile-first, Tailwind CSS uniquement, architecture modulaire, etc.)
- **TOUJOURS développer en DEV d'abord, JAMAIS directement en PROD**

---

## PHASE 1 : EXPLORE 🔍

**Objectif :** Rassembler toutes les informations nécessaires avant de planifier

### Étape 1.1 : Recherche externe (si nécessaire)

Si la fonctionnalité requiert des connaissances techniques spécifiques (librairie, API, pattern architectural), effectue des recherches :

- Utilise WebSearch pour trouver la documentation officielle la plus récente
- Cherche les best practices et patterns recommandés
- Identifie les potentiels pièges et erreurs courantes

**Note :** Ne fais cette étape QUE si tu as besoin d'informations externes. Ne perds pas de temps si tu connais déjà la technologie.

### Étape 1.2 : Analyse du codebase existant (OBLIGATOIRE)

Explore le projet A2M pour comprendre :

**Architecture actuelle :**
- Utilise l'agent Explore (Task tool avec subagent_type=Explore) pour comprendre la structure du projet
- Identifie les modules existants similaires (features/finances est le module de référence le plus complet)
- Repère les patterns architecturaux utilisés (DataContext, services, hooks personnalisés)

**Composants réutilisables :**
- Cherche les composants UI existants qui pourraient être réutilisés
- Identifie les services API existants (facturesService.js, clientsService.js)
- Repère les hooks personnalisés disponibles (useData.js, useClientUpdate.js)

**Configuration et dépendances :**
- Lis package.json pour connaître les dépendances installées
- Vérifie les scripts disponibles (dev, build, lint, preview)
- Identifie les outils de test configurés (s'il y en a)

**Base de données :**
- Si la fonctionnalité nécessite des modifications DB, explore les tables existantes
- Comprends les relations entre tables
- Identifie les triggers, vues et policies RLS déjà en place

**⚠️ Environnement DEV vs PROD :**
- Vérifie que tu travailles dans l'environnement DEV (vérifier `.env.dev`)
- Identifie si la fonctionnalité nécessite des migrations DB (si oui → run-migration-dev.sh)
- **Ne JAMAIS toucher à la base PROD pendant l'exploration**

### Étape 1.3 : Documentation de tes découvertes

Synthétise tes découvertes en listant :

1. **Ressources externes trouvées** (documentation, exemples, best practices)
2. **Modules/composants existants à réutiliser**
3. **Patterns architecturaux à suivre** (basés sur features/finances)
4. **Modifications DB nécessaires** (si applicable)
5. **Dépendances à installer** (si nécessaire)
6. **Contraintes techniques identifiées**

---

## PHASE 2 : PLAN 📋

**Objectif :** Créer un plan détaillé d'implémentation avant de coder

### Étape 2.1 : Architecture de la fonctionnalité

Définis l'architecture complète en suivant le modèle features/finances :

**Structure des fichiers :**
```
src/features/[nom-module]/
├── pages/              # Pages principales
├── components/         # Composants spécifiques au module
├── services/           # Appels API (Supabase)
├── hooks/              # Hooks personnalisés
└── utils/              # Utilitaires (formatters, constants)
```

**Pour chaque dossier, liste les fichiers à créer/modifier avec leur responsabilité.**

### Étape 2.2 : Modifications de la base de données (si applicable)

Si la fonctionnalité nécessite des changements DB :

**⚠️ IMPORTANT - Migration DEV → PROD :**
- Créer un fichier de migration SQL : `database/migrations/XXX_description.sql`
- Le plan doit prévoir l'exécution dans DEV d'abord (`./run-migration-dev.sh`)
- Prévoir l'exécution ultérieure dans PROD (`./run-migration-prod.sh`)
- **JAMAIS de modifications manuelles direct dans Supabase UI**

**Tables à créer :**
- Nom de la table
- Colonnes (nom, type, contraintes)
- Primary key (UUID avec `gen_random_uuid()`)
- Foreign keys avec relations
- Indexes nécessaires
- Timestamps : `created_at`, `updated_at`

**Triggers et vues :**
- Triggers automatiques (ex: mise à jour de statut)
- Vues SQL pour jointures fréquentes
- Fonctions SECURITY DEFINER si nécessaire (RLS)

**Policies RLS :**
- Définir les policies de sécurité Row Level Security
- **RLS TOUJOURS activé** pour toutes les tables
- Tester les policies en DEV avant PROD

### Étape 2.3 : Design UI/UX (Mobile-First OBLIGATOIRE)

**RAPPEL CRITIQUE :** Le mobile est la plateforme principale. Commence TOUJOURS par mobile.

**Mobile (< 768px) :**
- Sketch des écrans principaux en mode mobile
- Navigation (bottom tabs, header, modals)
- Taille minimale boutons : 44x44px
- Taille minimale police : 16px
- Gestes tactiles (swipe, tap)

**Desktop (≥ 768px) :**
- Adaptations pour grand écran (si applicable)
- Layouts responsive (grid, flexbox)

**Composants UI nécessaires :**
- Liste des composants à créer
- Composants réutilisables à adapter
- États des composants (loading, error, empty)

### Étape 2.4 : Logique métier et flux de données

**Services API :**
- Liste des fonctions à créer dans les services
- Endpoints Supabase à appeler
- Gestion des erreurs

**Hooks personnalisés :**
- Hooks à créer pour la logique métier
- Intégration avec DataContext (si applicable)
- Listeners/observers pour synchronisation temps réel

**Flux de données :**
- Diagramme simplifié du flux de données
- Événements déclenchés (create, update, delete)
- Mises à jour automatiques (pattern Observer si pertinent)

### Étape 2.5 : Dépendances et configuration

**Nouvelles dépendances :**
- Liste des packages npm à installer (avec version)
- Justification de chaque dépendance

**Configuration :**
- Modifications de routing (React Router)
- Ajouts dans les contexts
- Variables d'environnement nécessaires

### Étape 2.6 : Plan de tests (pour la phase TEST)

**Tests à exécuter :**
- Commandes disponibles dans package.json (npm run dev, npm run build, npm run lint)
- Points de vérification manuels (UI, navigation, fonctionnalités)
- Scénarios utilisateur à tester

**NE PAS créer de fichiers de tests unitaires** si aucun framework de test n'est configuré.

### Étape 2.7 : Identification des incertitudes et questions

**TRÈS IMPORTANT :** Réfléchis de manière critique et identifie :

**Questions de clarification :**
- Quels aspects de la fonctionnalité ne sont pas clairs ?
- Quels choix d'implémentation nécessitent validation ?
- Y a-t-il des ambiguïtés dans les spécifications ?

**Risques techniques :**
- Quelles parties de l'implémentation sont complexes ?
- Y a-t-il des incompatibilités potentielles ?
- Quels sont les points de défaillance possibles ?

**Choix d'architecture :**
- Plusieurs approches sont-elles possibles ? Laquelle privilégier ?
- Faut-il créer de nouveaux patterns ou réutiliser l'existant ?
- Comment gérer les cas limites ?

### Étape 2.8 : Création du plan final

Synthétise toutes les étapes ci-dessus dans un plan structuré :

```markdown
## Plan d'implémentation - [Nom de la fonctionnalité]

### 1. Architecture
- Fichiers à créer : [liste]
- Fichiers à modifier : [liste]
- Branche Git : feature/[nom-fonctionnalite]

### 2. Base de données (si applicable)
- Migration SQL : `database/migrations/XXX_description.sql`
- Tables : [détails]
- Triggers/Vues : [détails]
- Policies RLS : [détails]
- **⚠️ Exécution DEV** : `./run-migration-dev.sh database/migrations/XXX_description.sql`
- **⚠️ Exécution PROD (ultérieure)** : `./run-migration-prod.sh database/migrations/XXX_description.sql`

### 3. UI/UX (Mobile-First)
- Écrans mobiles : [description]
- Adaptations desktop : [description]
- Composants UI : [liste]

### 4. Logique métier
- Services : [fonctions à créer]
- Hooks : [hooks personnalisés]
- Flux de données : [description]

### 5. Dépendances
- Packages à installer : [liste]
- Configuration : [modifications]

### 6. Plan de tests (en DEV)
- Commandes à exécuter : [liste]
- Vérifications manuelles : [liste]
- Tests DB en DEV : [points à vérifier]

### 7. Plan de déploiement PROD (après validation DEV)
- Merge feature → dev
- Exécution migration PROD : `./run-migration-prod.sh`
- Merge dev → prod
- Déploiement Vercel automatique
- Tests PROD

### 8. Questions et incertitudes
- [Question 1]
- [Question 2]
- ...
```

### Étape 2.9 : ARRÊT OBLIGATOIRE - Demande de validation ⛔

**STOP ! Ne code PAS encore.**

Présente le plan complet à l'utilisateur et :

1. **Affiche le plan structuré** tel que défini ci-dessus
2. **Pose toutes tes questions** identifiées dans l'Étape 2.7
3. **Demande explicitement validation** : "Peux-tu valider ce plan avant que je commence à coder ?"
4. **Attends la réponse de l'utilisateur** avant de passer à la phase CODE

**L'utilisateur peut :**
- Valider le plan → Passe à la phase CODE
- Demander des modifications → Ajuste le plan
- Répondre à tes questions → Clarifie les incertitudes
- Rejeter le plan → Recommence la phase PLAN

---

## PHASE 3 : CODE 💻

**Objectif :** Implémenter la fonctionnalité selon le plan validé **EN DEV UNIQUEMENT**

### Prérequis

✅ Le plan a été validé par l'utilisateur
✅ Toutes les questions ont été clarifiées
✅ Tu travailles sur une branche feature ou dev
✅ L'environnement DEV est configuré (`.env.dev`)

**⚠️ RAPPEL CRITIQUE : Tout le code se fait en DEV. Pas de modifications en PROD pendant cette phase.**

### Étape 3.1 : Initialisation

**Créer la branche Git :**
```bash
git checkout dev
git pull origin dev
git checkout -b feature/[nom-fonctionnalite]
```

**Utilise TodoWrite pour créer ta todo list complète** basée sur le plan validé :

```javascript
// Exemple de todo list
[
  { content: "Installer les dépendances npm", status: "pending", activeForm: "Installation des dépendances npm" },
  { content: "Créer les tables Supabase", status: "pending", activeForm: "Création des tables Supabase" },
  { content: "Créer le service API", status: "pending", activeForm: "Création du service API" },
  { content: "Créer les hooks personnalisés", status: "pending", activeForm: "Création des hooks personnalisés" },
  { content: "Créer les composants UI", status: "pending", activeForm: "Création des composants UI" },
  { content: "Créer les pages", status: "pending", activeForm: "Création des pages" },
  { content: "Intégrer le routing", status: "pending", activeForm: "Intégration du routing" },
  { content: "Tester en mode dev", status: "pending", activeForm: "Test en mode dev" }
]
```

### Étape 3.2 : Ordre d'implémentation (RESPECTER CET ORDRE)

**1. Base de données (si applicable) - EN DEV UNIQUEMENT**
- Créer le fichier de migration : `database/migrations/XXX_description.sql`
- Exécuter la migration **EN DEV** :
  ```bash
  ./run-migration-dev.sh database/migrations/XXX_description.sql
  ```
- Vérifier dans Supabase DEV que les tables/vues/triggers sont créés
- Tester les policies RLS en DEV
- **Marquer la tâche comme completed**
- **⚠️ NE PAS exécuter en PROD (ce sera fait en PHASE 4)**

**2. Services API**
- Créer les fichiers dans features/[module]/services/
- Implémenter les fonctions CRUD
- Gérer les erreurs (try/catch)
- **Marquer la tâche comme completed**

**3. Hooks personnalisés**
- Créer les fichiers dans features/[module]/hooks/
- Implémenter la logique métier
- Intégrer avec DataContext si nécessaire
- **Marquer la tâche comme completed**

**4. Composants UI (Mobile-First)**
- Créer les composants dans features/[module]/components/
- **COMMENCER PAR MOBILE** (< 768px)
- Utiliser UNIQUEMENT Tailwind CSS
- Boutons min 44x44px, police min 16px
- Ajouter les adaptations desktop ensuite
- **Marquer chaque composant comme completed**

**5. Pages**
- Créer les pages dans features/[module]/pages/
- Intégrer les composants
- Gérer les états (loading, error, empty)
- **Marquer chaque page comme completed**

**6. Routing**
- Ajouter les routes dans App.tsx ou router config
- Configurer ProtectedRoute si nécessaire
- **Marquer la tâche comme completed**

**7. Intégration avec le reste de l'app**
- Ajouter les liens de navigation
- Mettre à jour le menu/bottom tabs
- **Marquer la tâche comme completed**

### Étape 3.3 : Règles de développement STRICTES

**Code Quality :**
- ✅ Mobile-first TOUJOURS
- ✅ Tailwind CSS UNIQUEMENT (jamais de CSS custom)
- ✅ Composants réutilisables (pas de duplication)
- ✅ Validation des inputs utilisateur
- ✅ Gestion d'erreurs avec try/catch
- ✅ Loading states (spinners, skeletons)
- ✅ Messages d'erreur clairs en français

**Conventions :**
- Composants : PascalCase (Button.jsx)
- Fonctions/variables : camelCase
- Constantes : UPPER_SNAKE_CASE
- Fichiers : camelCase.jsx
- Dossiers : kebab-case

**Architecture :**
- Séparer logique métier et présentation
- Utiliser des services pour les appels API (jamais directement dans les composants)
- Utiliser des hooks pour la logique réutilisable
- Suivre le pattern du module finances (référence)

### Étape 3.4 : Progression et communication

**À chaque tâche complétée :**
1. Marque la tâche comme completed dans TodoWrite
2. Passe à la suivante
3. Communique brièvement ce qui a été fait

**Si tu rencontres un problème :**
1. Ne marque PAS la tâche comme completed
2. Crée une nouvelle tâche pour résoudre le blocage
3. Informe l'utilisateur du problème

### Étape 3.5 : Vérification finale avant tests

Avant de passer à la phase TEST, vérifie que :

- ✅ Toutes les tâches de la todo list sont completed
- ✅ Aucune erreur TypeScript/ESLint visible
- ✅ Toutes les conventions ont été respectées
- ✅ Le code est mobile-first
- ✅ Tailwind CSS uniquement utilisé

### Étape 3.6 : Commit intermédiaire (optionnel)

Si l'implémentation est volumineuse, tu peux faire un commit intermédiaire sur ta branche feature :

```bash
git add .
git commit -m "feat([module]): implémentation [description]"
```

**Note :** Ce commit reste sur ta branche feature. Le merge sur develop se fera après la phase TEST.

---

## PHASE 4 : TEST 🧪

**Objectif :** Valider que la fonctionnalité fonctionne correctement **EN DEV**

**⚠️ IMPORTANT : Cette phase valide la fonctionnalité EN ENVIRONNEMENT DEV UNIQUEMENT.**
**Le déploiement PROD se fait APRÈS cette phase (voir Étape 4.9).**

### Étape 4.1 : Identification des tests disponibles

**Lis package.json pour identifier les commandes de test :**

```bash
# Commandes standard à vérifier
- npm run dev      # Serveur de développement
- npm run build    # Build de production
- npm run lint     # Vérification ESLint
- npm test         # Tests unitaires (si configuré)
```

**IMPORTANT :** NE CRÉE PAS de fichiers de tests unitaires s'ils n'existent pas déjà dans le projet.

### Étape 4.2 : Tests automatisés (si disponibles)

**Si des tests existent dans le projet :**
- Exécute `npm test`
- Vérifie que tous les tests passent
- Si des tests échouent, corrige-les

**Si AUCUN test n'existe :**
- Passe directement aux tests manuels
- N'essaie PAS de créer un framework de test

### Étape 4.3 : Linting et vérification du code

**Exécute le linter :**
```bash
npm run lint
```

**Si des erreurs apparaissent :**
- Corrige toutes les erreurs ESLint
- Assure-toi qu'il n'y a aucune warning critique

### Étape 4.4 : Build de production

**Teste que le build passe :**
```bash
npm run build
```

**Vérifie :**
- Le build se termine sans erreur
- Aucune erreur TypeScript
- La taille du bundle est raisonnable

### Étape 4.5 : Tests manuels en mode développement

**Lance le serveur de dev :**
```bash
npm run dev
```

**Teste manuellement la fonctionnalité :**

**Navigation :**
- ✅ Les routes fonctionnent correctement
- ✅ Les liens de navigation sont cliquables
- ✅ Le back button fonctionne (mobile)

**UI/UX Mobile :**
- ✅ Interface responsive sur mobile (< 768px)
- ✅ Boutons suffisamment grands (44x44px)
- ✅ Police lisible (≥ 16px)
- ✅ Pas de zoom automatique sur les inputs
- ✅ Gestes tactiles fonctionnent (si applicable)

**UI/UX Desktop :**
- ✅ Interface adaptée sur desktop (≥ 768px)
- ✅ Layouts responsive corrects

**Fonctionnalités :**
- ✅ Création de données fonctionne
- ✅ Lecture/affichage des données fonctionne
- ✅ Modification des données fonctionne
- ✅ Suppression des données fonctionne (si applicable)
- ✅ Filtres/recherche fonctionnent (si applicable)

**États de l'application :**
- ✅ Loading states s'affichent pendant les chargements
- ✅ Messages d'erreur clairs en cas d'échec
- ✅ Empty states pour listes vides
- ✅ Validation des formulaires fonctionne

**Intégration :**
- ✅ Synchronisation avec DataContext (si applicable)
- ✅ Mises à jour automatiques fonctionnent
- ✅ Pas de régression sur les autres modules

### Étape 4.6 : Vérification Supabase (si applicable)

**Si la fonctionnalité utilise Supabase :**

**Base de données :**
- ✅ Les tables ont bien été créées
- ✅ Les données sont correctement enregistrées
- ✅ Les relations (foreign keys) fonctionnent
- ✅ Les triggers s'exécutent correctement
- ✅ Les vues retournent les bonnes données

**RLS (Row Level Security) :**
- ✅ Les policies sont actives
- ✅ Les utilisateurs ne peuvent accéder qu'à leurs données
- ✅ Aucune fuite de données entre utilisateurs

**Storage (si applicable) :**
- ✅ Upload de fichiers fonctionne
- ✅ Téléchargement de fichiers fonctionne
- ✅ Suppression de fichiers fonctionne

### Étape 4.7 : Rapport de test final

**Synthétise les résultats des tests :**

```markdown
## Rapport de tests - [Nom de la fonctionnalité]

### ✅ Tests automatisés
- [x] Lint : PASS
- [x] Build : PASS
- [x] Tests unitaires : PASS (ou N/A si non configuré)

### ✅ Tests manuels
- [x] Navigation : OK
- [x] UI Mobile : OK
- [x] UI Desktop : OK
- [x] Fonctionnalités CRUD : OK
- [x] États (loading/error/empty) : OK
- [x] Intégration : OK

### ✅ Supabase (si applicable)
- [x] Tables : OK
- [x] Triggers/Vues : OK
- [x] RLS : OK
- [x] Storage : OK (ou N/A)

### ⚠️ Problèmes identifiés
- [Aucun] ou [Liste des problèmes]

### 🎯 Conclusion
La fonctionnalité est [PRÊTE/NÉCESSITE DES CORRECTIONS].
```

### Étape 4.8 : Correction des bugs (si nécessaire)

**Si des bugs sont identifiés :**

1. **Liste tous les bugs** dans une nouvelle todo list
2. **Corrige chaque bug** un par un
3. **Marque chaque correction comme completed**
4. **Re-teste** après chaque correction
5. **Met à jour le rapport de test**

**Si tout fonctionne :**
- Informe l'utilisateur que la fonctionnalité est validée en DEV
- Passe à l'étape suivante : Déploiement PROD

### Étape 4.9 : Commit et merge sur develop

**Une fois TOUS les tests DEV validés :**

```bash
# Commit final sur la branche feature
git add .
git commit -m "feat([module]): [description de la fonctionnalité]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push la branche feature
git push origin feature/[nom-fonctionnalite]

# Merger sur develop
git checkout develop
git pull origin develop
git merge feature/[nom-fonctionnalite]
git push origin develop

# Optionnel : Supprimer la branche feature
git branch -d feature/[nom-fonctionnalite]
```

**✅ À ce stade : La fonctionnalité est validée en DEV et mergée sur develop.**

---

## PHASE 5 : DÉPLOIEMENT PROD 🚀

**Objectif :** Déployer la fonctionnalité validée en production

**⚠️ PRÉREQUIS OBLIGATOIRES :**
- ✅ Tous les tests DEV sont passés
- ✅ La fonctionnalité est mergée sur develop
- ✅ L'utilisateur a donné son accord pour le déploiement PROD

### Étape 5.1 : Exécution de la migration DB en PROD (si applicable)

**Si la fonctionnalité nécessite des changements DB :**

```bash
# Vérifier que tu as .env.prod configuré
source .env.prod

# Exécuter la migration PROD (avec confirmation)
./run-migration-prod.sh database/migrations/XXX_description.sql
```

**Le script demandera confirmation avant d'exécuter (sécurité).**

**Vérifications après migration :**
- Connecte-toi à Supabase PROD via l'UI
- Vérifie que les tables/vues/triggers sont créés
- Vérifie que les données existantes ne sont pas corrompues
- Teste manuellement une requête simple

### Étape 5.2 : Merge dev → prod

**Une fois la migration PROD exécutée (si applicable) :**

```bash
# Merger dev sur prod
git checkout prod
git pull origin prod
git merge dev
git push origin prod
```

**⚠️ ATTENTION : Le push sur prod déclenche automatiquement le déploiement Vercel.**

### Étape 5.3 : Vérification du déploiement Vercel

**Attendre le déploiement automatique :**
- Vercel détecte le push sur main
- Le build démarre automatiquement
- Surveille les logs Vercel pour vérifier qu'il n'y a pas d'erreur

**URL de vérification :** https://a2m-app.vercel.app

### Étape 5.4 : Tests manuels en PROD

**Teste la fonctionnalité EN PRODUCTION :**

**Navigation :**
- ✅ Les routes fonctionnent correctement
- ✅ Pas d'erreur 404 ou 500

**Fonctionnalités :**
- ✅ Création de données fonctionne
- ✅ Lecture/affichage des données fonctionne
- ✅ Modification des données fonctionne
- ✅ Suppression des données fonctionne (si applicable)

**Base de données PROD :**
- ✅ Les données sont correctement enregistrées
- ✅ Les policies RLS fonctionnent
- ✅ Pas de fuite de données entre utilisateurs

**Performance :**
- ✅ Temps de chargement acceptable
- ✅ Pas de spinner infini
- ✅ Pas d'erreur console

### Étape 5.5 : Rapport de déploiement PROD

**Synthétise les résultats du déploiement :**

```markdown
## Rapport de déploiement PROD - [Nom de la fonctionnalité]

### ✅ Migration DB PROD
- [x] Migration exécutée : OK (ou N/A)
- [x] Tables créées : OK
- [x] Policies RLS : OK
- [x] Données existantes : OK

### ✅ Déploiement Vercel
- [x] Build : PASS
- [x] Déploiement : OK
- [x] URL accessible : https://a2m-app.vercel.app

### ✅ Tests PROD
- [x] Navigation : OK
- [x] Fonctionnalités : OK
- [x] Base de données : OK
- [x] Performance : OK

### ⚠️ Problèmes identifiés en PROD
- [Aucun] ou [Liste des problèmes]

### 🎯 Conclusion
La fonctionnalité est [DÉPLOYÉE EN PROD AVEC SUCCÈS / NÉCESSITE DES CORRECTIONS].
```

### Étape 5.6 : Rollback en cas de problème critique

**Si un problème critique est identifié en PROD :**

**Option 1 : Rollback Git (recommandé)**
```bash
# Revenir à l'état précédent sur prod
git checkout prod
git revert HEAD
git push origin prod
```

**Option 2 : Rollback base de données (si nécessaire)**
- Créer une migration de rollback manuelle
- L'exécuter avec `./run-migration-prod.sh`

**Option 3 : Hotfix immédiat**
- Créer une branche `hotfix/[nom]` depuis prod
- Corriger le bug
- Tester en DEV
- Merger hotfix → prod directement

---

## Résumé du workflow

```
EXPLORE 🔍 (en DEV)
└─ Recherche externe (si nécessaire)
└─ Analyse codebase (OBLIGATOIRE)
└─ Vérification environnement DEV
└─ Documentation des découvertes
    ↓
PLAN 📋
└─ Architecture détaillée
└─ Modifications DB avec migrations (si applicable)
└─ Design UI/UX (Mobile-First)
└─ Logique métier et flux
└─ Dépendances et configuration
└─ Plan de tests DEV
└─ Plan de déploiement PROD
└─ Identification des incertitudes
└─ ⛔ ARRÊT - Demande de validation utilisateur
    ↓
CODE 💻 (après validation - EN DEV UNIQUEMENT)
└─ Créer branche feature
└─ Création todo list complète
└─ Implémentation dans l'ordre :
    1. Migration DB en DEV (./run-migration-dev.sh)
    2. Services API
    3. Hooks personnalisés
    4. Composants UI (Mobile-First)
    5. Pages
    6. Routing
    7. Intégration
└─ Respect strict des conventions
└─ Commit intermédiaire (optionnel)
    ↓
TEST 🧪 (EN DEV)
└─ Tests automatisés (lint, build, tests unitaires)
└─ Tests manuels (navigation, UI, fonctionnalités)
└─ Vérification Supabase DEV (si applicable)
└─ Rapport de test final DEV
└─ Correction des bugs (si nécessaire)
└─ Commit et merge sur develop
    ↓
DÉPLOIEMENT PROD 🚀 (après validation DEV)
└─ Migration DB en PROD (./run-migration-prod.sh)
└─ Merge develop → main
└─ Déploiement automatique Vercel
└─ Tests manuels en PROD
└─ Rapport de déploiement PROD
└─ Rollback si problème critique
```

---

## Règles CRITIQUES à ne JAMAIS oublier

### Développement
1. **Mobile-First OBLIGATOIRE** : Toujours commencer par mobile (< 768px)
2. **Tailwind CSS UNIQUEMENT** : Jamais de CSS custom
3. **Arrêt après PLAN** : Toujours demander validation avant de coder
4. **TodoWrite systématique** : Tracker chaque tâche
5. **Ne pas créer de tests** : Si aucun framework de test n'existe
6. **Suivre l'architecture** : features/finances est la référence
7. **Conventions strictes** : Respecter tous les nommages et patterns
8. **Questions = force** : Pose des questions plutôt que d'halluciner
9. **Pas de localStorage** : Utiliser Supabase ou React state uniquement
10. **RLS activé** : Toujours activer Row Level Security sur Supabase

### DEV → PROD (NOUVELLES RÈGLES CRITIQUES)
11. **TOUJOURS DEV d'abord** : Jamais de développement direct en PROD
12. **Migrations SQL obligatoires** : Jamais de modifications manuelles dans Supabase UI
13. **run-migration-dev.sh EN PREMIER** : Toujours tester les migrations en DEV
14. **run-migration-prod.sh APRÈS validation** : Exécuter en PROD seulement après tests DEV
15. **Git workflow strict** : feature → dev → prod (jamais de raccourci)
16. **Merge sur prod = déploiement** : Le push sur prod déclenche Vercel automatiquement
17. **Tests PROD obligatoires** : Toujours tester en PROD après déploiement
18. **Rollback prévu** : Toujours avoir un plan de rollback en cas de problème

---

**Maintenant, quelle fonctionnalité veux-tu que j'implémente ?**
