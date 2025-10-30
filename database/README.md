# Database Migrations

Ce dossier contient les migrations SQL pour la base de données Supabase.

## Structure

```
database/
└── migrations/
    ├── 001_description.sql
    ├── 002_description.sql
    └── ...
```

## Conventions de nommage

Les fichiers de migration doivent suivre ce format :
```
XXX_description.sql
```

Où :
- `XXX` = Numéro séquentiel (001, 002, 003, ...)
- `description` = Description courte de la migration (snake_case)

Exemples :
- `001_create_users_table.sql`
- `002_add_clients_table.sql`
- `003_create_invoices_view.sql`

## Workflow de migration

### 1. Créer une migration

Créer un nouveau fichier dans `database/migrations/` :

```sql
-- database/migrations/001_create_users_table.sql

-- Description: Create users table with authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### 2. Tester en DEV

```bash
./run-migration-dev.sh database/migrations/001_create_users_table.sql
```

Vérifications :
- La migration s'exécute sans erreur
- Les tables/vues/triggers sont créés correctement
- Les policies RLS fonctionnent
- Tester manuellement les opérations CRUD

### 3. Déployer en PROD

**UNIQUEMENT après validation complète en DEV** :

```bash
./run-migration-prod.sh database/migrations/001_create_users_table.sql
```

⚠️ Le script demandera une double confirmation pour éviter les erreurs.

## Best practices

1. **Toujours tester en DEV d'abord** - Jamais de migration directe en PROD
2. **Migrations idempotentes** - Utiliser `IF NOT EXISTS` / `IF EXISTS`
3. **RLS activé** - Toujours activer Row Level Security
4. **Rollback plan** - Prévoir une migration inverse si nécessaire
5. **Commentaires** - Documenter les changements complexes
6. **Transactions** - Les migrations sont atomiques (tout ou rien)

## Troubleshooting

### psql: command not found

Installer PostgreSQL client :
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### Connection refused

Vérifier que :
- Le fichier `.env.dev` ou `.env.prod` existe
- `DATABASE_URL` est correctement configuré
- Les credentials Supabase sont valides
- L'adresse IP est autorisée dans Supabase (pour PROD)

### Migration échoue

1. Lire le message d'erreur PostgreSQL
2. Vérifier la syntaxe SQL
3. Vérifier que les dépendances existent (tables, colonnes référencées)
4. Tester manuellement dans l'éditeur SQL Supabase
