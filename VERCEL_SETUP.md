# Configuration Vercel - a2m-concept-app

## Projet Vercel créé

✅ **Nom du projet** : a2m-concept-app
✅ **Repository GitHub** : https://github.com/youssef67/a2m-concept-app
✅ **Compte Vercel** : youssef-moudnis-projects

## Configuration à compléter

### 1. Configurer la branche de production

Par défaut, Vercel déploie depuis la branche `main`. Nous devons changer cela pour déployer depuis `prod`.

**Via le dashboard Vercel :**

1. Allez sur : https://vercel.com/youssef-moudnis-projects/a2m-concept-app
2. Cliquez sur **Settings**
3. Allez dans **Git**
4. Section **Production Branch**
5. Changez de `main` à `prod`
6. Cliquez sur **Save**

### 2. Configurer les variables d'environnement PROD

**Variables à ajouter (depuis .env.prod) :**

1. Allez sur : https://vercel.com/youssef-moudnis-projects/a2m-concept-app
2. Cliquez sur **Settings**
3. Allez dans **Environment Variables**
4. Ajoutez les variables suivantes pour **Production** uniquement :

| Variable Name              | Value                                                      | Environment |
|---------------------------|-------------------------------------------------------------|-------------|
| `SUPABASE_URL`            | `https://lynokogmbphznaobjaqo.supabase.co`                 | Production  |
| `SUPABASE_ANON_KEY`       | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...` | Production  |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...` | Production  |

**Note :** Les valeurs complètes se trouvent dans `.env.prod` (fichier local, pas dans Git).

⚠️ **IMPORTANT** : Cochez uniquement **Production**, PAS Preview ni Development.

### 3. Vérifier la configuration du framework

Si vous utilisez un framework (React, Next.js, Vite, etc.), vérifiez que Vercel détecte le bon framework :

1. Allez sur : https://vercel.com/youssef-moudnis-projects/a2m-concept-app
2. Cliquez sur **Settings**
3. Allez dans **General**
4. Vérifiez **Framework Preset**
5. Si nécessaire, sélectionnez le bon framework

### 4. Premier déploiement

Une fois la configuration terminée, vous pouvez déclencher le premier déploiement :

**Option A - Via Git (recommandé) :**
```bash
# Assurez-vous d'être sur la branche prod
git checkout prod

# Mergez les changements depuis dev
git merge dev

# Poussez vers GitHub (déclenche automatiquement le déploiement Vercel)
git push origin prod
```

**Option B - Via CLI :**
```bash
vercel --prod
```

### 5. Vérification du déploiement

Après le déploiement :

1. Vérifiez que le build passe sans erreur
2. Testez l'URL de production
3. Vérifiez que la connexion Supabase PROD fonctionne
4. Testez les fonctionnalités principales

## URLs du projet

- **Dashboard Vercel** : https://vercel.com/youssef-moudnis-projects/a2m-concept-app
- **URL de production** : (sera générée après le premier déploiement)
- **Repository GitHub** : https://github.com/youssef67/a2m-concept-app

## Workflow de déploiement

```
┌─────────────────────────────────────────────┐
│ 1. Développement sur branche dev            │
│    - Coder les fonctionnalités              │
│    - Tester localement                      │
│    - Commit et push sur dev                 │
├─────────────────────────────────────────────┤
│ 2. Validation en environnement DEV          │
│    - Tester avec base Supabase DEV          │
│    - Vérifier toutes les fonctionnalités    │
├─────────────────────────────────────────────┤
│ 3. Merge dev → prod                         │
│    git checkout prod                        │
│    git merge dev                            │
│    git push origin prod                     │
├─────────────────────────────────────────────┤
│ 4. Déploiement automatique Vercel           │
│    - Vercel détecte le push sur prod        │
│    - Build automatique                      │
│    - Déploiement en production              │
├─────────────────────────────────────────────┤
│ 5. Tests en production                      │
│    - Vérifier l'URL de production           │
│    - Tester avec base Supabase PROD         │
│    - Vérifier les fonctionnalités           │
└─────────────────────────────────────────────┘
```

## Commandes Vercel utiles

```bash
# Voir le statut du projet
vercel project ls

# Déployer manuellement en production
vercel --prod

# Voir les déploiements
vercel ls

# Ouvrir le dashboard du projet
vercel project open

# Voir les logs de production
vercel logs --prod

# Lister les variables d'environnement
vercel env ls
```

## Troubleshooting

### Build échoue

1. Vérifiez les logs de build dans le dashboard Vercel
2. Assurez-vous que `package.json` contient les bonnes commandes de build
3. Vérifiez que toutes les dépendances sont dans `package.json`

### Variables d'environnement manquantes

1. Vérifiez que les variables sont bien configurées dans Settings → Environment Variables
2. Assurez-vous qu'elles sont assignées à l'environnement **Production**
3. Redéployez le projet après avoir ajouté les variables

### Mauvaise branche déployée

1. Vérifiez Settings → Git → Production Branch
2. Assurez-vous que c'est bien `prod` et non `main`

## Support

- Documentation Vercel : https://vercel.com/docs
- Dashboard projet : https://vercel.com/youssef-moudnis-projects/a2m-concept-app
