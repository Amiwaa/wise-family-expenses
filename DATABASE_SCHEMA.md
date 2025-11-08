# Database Schema Documentation

## Overview

This document describes the database schema for the Wise Family Expenses application. The database uses PostgreSQL (Neon) and is managed through migration scripts.

## Database Tables

### 1. `families`
Stores family/group information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique family identifier |
| `family_name` | VARCHAR(255) | NOT NULL | Name of the family/group |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the family was created |

**Indexes:** None (small table, primary key is sufficient)

---

### 2. `family_members`
Stores members belonging to each family.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique member identifier |
| `family_id` | INTEGER | NOT NULL, FOREIGN KEY → families(id) | Reference to family |
| `email` | VARCHAR(255) | NOT NULL | Member's email address |
| `name` | VARCHAR(255) | NOT NULL | Member's name |
| `is_admin` | BOOLEAN | DEFAULT FALSE | Whether member is an admin |
| `joined_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When member joined |

**Indexes:**
- `idx_family_members_family_id` - For faster family member lookups

**Constraints:**
- UNIQUE(`family_id`, `email`) - One email per family
- FOREIGN KEY `family_id` → `families(id)` ON DELETE CASCADE

---

### 3. `expenses`
Stores expense transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique expense identifier |
| `family_id` | INTEGER | NOT NULL, FOREIGN KEY → families(id) | Reference to family |
| `amount` | DECIMAL(10,2) | NOT NULL | Expense amount |
| `description` | TEXT | NULL | Expense description |
| `category` | VARCHAR(255) | NULL | Expense category |
| `added_by` | VARCHAR(255) | NULL | Who added the expense |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When expense was created |

**Indexes:**
- `idx_expenses_family_id` - For faster family expense queries

**Constraints:**
- FOREIGN KEY `family_id` → `families(id)` ON DELETE CASCADE

---

### 4. `savings`
Stores savings entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique savings identifier |
| `family_id` | INTEGER | NOT NULL, FOREIGN KEY → families(id) | Reference to family |
| `amount` | DECIMAL(10,2) | NOT NULL | Savings amount |
| `description` | TEXT | NULL | Savings description |
| `goal` | DECIMAL(10,2) | NULL | Savings goal (optional) |
| `added_by` | VARCHAR(255) | NULL | Who added the savings |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When savings was created |

**Indexes:**
- `idx_savings_family_id` - For faster family savings queries

**Constraints:**
- FOREIGN KEY `family_id` → `families(id)` ON DELETE CASCADE

---

### 5. `currents`
Stores current account transactions (credits and debits).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique transaction identifier |
| `family_id` | INTEGER | NOT NULL, FOREIGN KEY → families(id) | Reference to family |
| `amount` | DECIMAL(10,2) | NOT NULL | Transaction amount |
| `description` | TEXT | NULL | Transaction description |
| `type` | VARCHAR(10) | NOT NULL, CHECK | Either 'credit' or 'debit' |
| `added_by` | VARCHAR(255) | NULL | Who added the transaction |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When transaction was created |

**Indexes:**
- `idx_currents_family_id` - For faster family current account queries

**Constraints:**
- FOREIGN KEY `family_id` → `families(id)` ON DELETE CASCADE
- CHECK `type IN ('credit', 'debit')` - Only allow credit or debit

---

### 6. `custom_sections`
Stores custom expense/savings sections created by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique section identifier |
| `family_id` | INTEGER | NOT NULL, FOREIGN KEY → families(id) | Reference to family |
| `name` | VARCHAR(255) | NOT NULL | Section name |
| `type` | VARCHAR(10) | NOT NULL, CHECK | Either 'expense' or 'saving' |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When section was created |

**Indexes:**
- `idx_custom_sections_family_id` - For faster family custom section queries

**Constraints:**
- FOREIGN KEY `family_id` → `families(id)` ON DELETE CASCADE
- CHECK `type IN ('expense', 'saving')` - Only allow expense or saving types

---

### 7. `custom_section_transactions`
Stores transactions within custom sections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique transaction identifier |
| `section_id` | INTEGER | NOT NULL, FOREIGN KEY → custom_sections(id) | Reference to custom section |
| `amount` | DECIMAL(10,2) | NOT NULL | Transaction amount |
| `description` | TEXT | NULL | Transaction description |
| `added_by` | VARCHAR(255) | NULL | Who added the transaction |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When transaction was created |

**Indexes:** None (queries filtered by section_id are typically small)

**Constraints:**
- FOREIGN KEY `section_id` → `custom_sections(id)` ON DELETE CASCADE

---

### 8. `categories`
Stores expense categories for each family.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique category identifier |
| `family_id` | INTEGER | NOT NULL, FOREIGN KEY → families(id) | Reference to family |
| `name` | VARCHAR(255) | NOT NULL | Category name |

**Indexes:** None (queries are typically filtered by family_id which has a unique constraint)

**Constraints:**
- FOREIGN KEY `family_id` → `families(id)` ON DELETE CASCADE
- UNIQUE(`family_id`, `name`) - One category name per family

---

## Database Management Scripts

### Check Database Schema
```bash
npm run db:check
```
This script connects to the database and displays:
- All existing tables
- Column definitions
- Indexes
- Constraints
- Comparison with expected schema
- Any missing tables, columns, or indexes

### Initialize Database
```bash
npm run db:init
```
This script creates all tables, indexes, and constraints if they don't exist. Safe to run multiple times (uses `IF NOT EXISTS`).

### Run Migrations
```bash
npm run db:migrate
```
This script applies all SQL migration files from `scripts/migrations/` in order.

---

## Connection Strings

The application uses two connection strings:

1. **DATABASE_URL** - Read-write connection for regular operations (SELECT, INSERT, UPDATE, DELETE)
2. **DATABASE_URL_DDL** - DDL connection for schema changes (CREATE, ALTER, DROP, etc.)

See `NEON_SETUP.md` for setup instructions.

---

## Schema Changes & Migrations

### Creating a New Migration

1. Create a new SQL file in `scripts/migrations/` with the format: `XXX_description.sql`
   - Use sequential numbers (001, 002, 003, etc.)
   - Use descriptive names (e.g., `002_add_user_preferences.sql`)

2. Write your migration SQL:
   ```sql
   -- Add new column
   ALTER TABLE families ADD COLUMN IF NOT EXISTS settings JSONB;
   
   -- Create new index
   CREATE INDEX IF NOT EXISTS idx_families_settings ON families USING GIN(settings);
   ```

3. Test the migration:
   ```bash
   npm run db:migrate
   ```

4. Verify the changes:
   ```bash
   npm run db:check
   ```

### Migration Best Practices

- Always use `IF NOT EXISTS` for tables, indexes, and columns to make migrations idempotent
- Test migrations on a development database first
- Keep migrations small and focused on one change
- Document breaking changes in migration comments
- Never modify existing migration files after they've been applied to production

---

## Future Schema Considerations

### Potential Improvements

1. **User Authentication**
   - Add `users` table if implementing proper authentication
   - Link `family_members.email` to `users.email`
   - Add password hash, reset tokens, etc.

2. **Audit Logging**
   - Add `updated_at` timestamps to all tables
   - Create `audit_log` table for tracking changes
   - Track who modified what and when

3. **Soft Deletes**
   - Add `deleted_at` timestamp to relevant tables
   - Allow data recovery without hard deletes

4. **Categories Enhancement**
   - Add `icon` or `color` fields to categories
   - Add category hierarchy (parent/child categories)
   - Add default categories per family template

5. **Budget Management**
   - Add `budgets` table for monthly/yearly budgets
   - Link budgets to categories
   - Track budget vs actual spending

6. **Recurring Transactions**
   - Add `recurring_expenses` table
   - Store frequency, next_due_date, etc.
   - Auto-create transactions based on schedule

7. **Attachments**
   - Add `expense_attachments` table
   - Store receipt images, documents
   - Link to expenses via foreign key

8. **Notifications**
   - Add `notifications` table
   - Store in-app notifications for family members
   - Track read/unread status

---

## Data Relationships

```
families (1) ──→ (N) family_members
families (1) ──→ (N) expenses
families (1) ──→ (N) savings
families (1) ──→ (N) currents
families (1) ──→ (N) custom_sections
families (1) ──→ (N) categories
custom_sections (1) ──→ (N) custom_section_transactions
```

All relationships use `ON DELETE CASCADE` to ensure data integrity when a family is deleted.

---

## Performance Considerations

### Indexes
- All foreign key columns are indexed for faster joins
- Consider adding indexes on frequently queried columns:
  - `expenses.created_at` (if sorting by date is common)
  - `expenses.category` (if filtering by category is common)
  - `family_members.email` (for login lookups)

### Query Optimization
- Use `EXPLAIN ANALYZE` to check query plans
- Consider partitioning large tables (expenses, savings) by date if they grow large
- Use connection pooling (already implemented with pg Pool)

---

## Security Considerations

1. **SQL Injection Prevention**
   - Always use parameterized queries (already implemented)
   - Never concatenate user input into SQL strings

2. **Data Access Control**
   - API routes should verify family membership before allowing access
   - Use `family_id` in WHERE clauses to ensure data isolation

3. **Connection Security**
   - Always use SSL for database connections (configured via `sslmode=require`)
   - Store connection strings in environment variables (never commit to git)

---

## Backup & Recovery

### Backup Strategy
1. Use Neon's automated backups (included in Neon plans)
2. Export data periodically:
   ```bash
   pg_dump $DATABASE_URL_DDL > backup.sql
   ```

### Recovery
1. Restore from backup:
   ```bash
   psql $DATABASE_URL_DDL < backup.sql
   ```

---

## Troubleshooting

### Tables not created?
- Check that `DATABASE_URL_DDL` is set correctly
- Verify DDL user has CREATE TABLE permissions
- Run `npm run db:check` to see current state

### Migration fails?
- Check migration SQL syntax
- Verify no conflicting constraints
- Check database logs for detailed error messages

### Performance issues?
- Run `npm run db:check` to verify indexes exist
- Use `EXPLAIN ANALYZE` on slow queries
- Consider adding additional indexes

---

## Contact & Support

For database-related issues, check:
1. This documentation
2. `NEON_SETUP.md` for connection setup
3. Database logs in Neon console
4. Application logs for query errors

