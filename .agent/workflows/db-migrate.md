---
name: Database Migration
description: Create and apply database migrations
---

# Database Migration Workflow

Guidelines for database schema changes.

## Migration Tools by Platform

| Platform | Tool |
|----------|------|
| PostgreSQL | `pg_migrate`, `sqitch`, `flyway` |
| MySQL | `mysql-migrate`, `flyway` |
| SQLite | `sqlite-migrate` |
| MongoDB | `migrate-mongo` |
| ORM-based | Prisma, Sequelize, Alembic, GORM |

## Creating a Migration

### Step 1: Generate File
```bash
# Prisma
npx prisma migrate dev --name add_users_table

# Alembic (Python)
alembic revision -m "add users table"

# Flyway
touch migrations/V001__add_users_table.sql

# Manual
touch migrations/$(date +%Y%m%d%H%M%S)_description.sql
```

### Step 2: Write Migration

```sql
-- Up Migration
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Down Migration (for rollback reference)
-- DROP TABLE IF EXISTS users;
```

### Step 3: Apply Migration
```bash
# Prisma
npx prisma migrate deploy

# Alembic
alembic upgrade head

# Flyway
flyway migrate

# Manual
psql $DATABASE_URL -f migrations/file.sql
```

## Common Patterns

### Add Column
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

### Add Index
```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### Add Foreign Key
```sql
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user
FOREIGN KEY (user_id) REFERENCES users(id);
```

### Modify Column
```sql
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
```

### Rename Column
```sql
ALTER TABLE users RENAME COLUMN name TO full_name;
```

## Rollback

```bash
# Prisma
npx prisma migrate reset

# Alembic
alembic downgrade -1

# Flyway
flyway undo
```

## Best Practices

1. **One change per migration** - Easier to rollback
2. **Always test locally first**
3. **Backup before production migrations**
4. **Use transactions when possible**
5. **Add indexes for foreign keys**

## Migration Checklist

- [ ] Migration file created
- [ ] SQL syntax verified
- [ ] Tested locally
- [ ] Rollback tested
- [ ] Applied to staging
- [ ] Applied to production
- [ ] Application code updated
