# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A2M Concepts App - Application de gestion pour A2M Concepts.

## Git Workflow

**Branches principales :**
- `dev` : Branche de développement et tests
- `prod` : Branche de production (déploiement Vercel)

**Workflow de développement :**

```
feature/xxx → dev → prod
```

**Règles importantes :**
1. **TOUJOURS** développer sur la branche `dev` ou sur une branche `feature/xxx`
2. **JAMAIS** de commit direct sur `prod`
3. Les nouvelles fonctionnalités suivent ce cycle :
   - Créer une branche `feature/[nom-fonctionnalite]` depuis `dev`
   - Développer et tester en local sur la branche feature
   - Merger `feature/xxx` → `dev` après validation
   - Tester en environnement DEV
   - Merger `dev` → `prod` pour déploiement production (Vercel)

**Commandes Git courantes :**
```bash
# Créer une nouvelle feature
git checkout dev
git pull origin dev
git checkout -b feature/[nom-fonctionnalite]

# Après développement et tests
git add .
git commit -m "feat: [description]"
git push origin feature/[nom-fonctionnalite]

# Merger sur dev
git checkout dev
git merge feature/[nom-fonctionnalite]
git push origin dev
```

## Repository GitHub

URL : https://github.com/youssef67/a2m-concept-app.git

## Project Status

Le projet est en phase d'initialisation. Ce fichier sera enrichi au fur et à mesure avec :
- Commandes de build et développement
- Architecture du projet et patterns clés
- Workflows de test
- Procédures de déploiement

## Notes for Future Development

Ce fichier doit être maintenu à jour avec les décisions architecturales, commandes communes et workflows spécifiques au projet.
