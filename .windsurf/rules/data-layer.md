---
trigger: model_decision
description: When working with Typescrip services
globs: 
---
# Data Layer Implementation

This rule covers the specific architecture of the data layer in WebInsight.

- **Profile Databases**: Each user profile has its own SQLite database located at `~/.config/webinsights/profiles/<profile_id>.db`.
    - Metadata (path, encryption status) is stored centrally (e.g., `profiles.json`).
    - Reference: [architecture.md](mdc:documentation/architecture.md) (Profile-Specific Database Architecture section)
- **Optional Encryption**: Profiles marked as "private" use SQLCipher for full database encryption.
    - Requires the `better-sqlite3-sqlcipher` binding.
    - Key is derived from user password via PBKDF2.
    - Reference: [architecture.md](mdc:documentation/architecture.md) (Optional Encryption section)
- **Drizzle ORM**: Used for:
    - Defining the database schema (`src/lib/server/db/schema`).
    - Generating SQL migration files (`migrations/*.sql`).
    - Type-safe querying *within the context of a loaded profile*.
- **Custom Migrations**: **Do not use the standard Drizzle `migrate` function.**
    - Migrations are applied via a custom script **on profile load**.
    - The process involves: connecting (with key if needed), checking `__drizzle_migrations`, identifying pending `.sql` files, executing them, and updating the history table.
    - This logic should be implemented using Effect TS for robustness.
    - Reference: [architecture.md](mdc:documentation/architecture.md) (Data Migrations On-Profile Load section)
- **Schema Validation**: Use `@effect/schema` (from [@effect-ts.mdc](mdc:.cursor/rules/effect-ts.mdc)) to validate data read from or written to the database.
- **Database Service**: Access to database operations should be managed through an Effect `Layer` (e.g., `ContentDB` service mentioned in [architecture.md](mdc:documentation/architecture.md)).
