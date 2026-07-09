use rusqlite::Connection;

/// Ordered, one-way schema migrations. Each entry runs exactly once per
/// database file — applied migrations are tracked in `schema_migrations` so
/// adding folders/categories/etc. later is a new entry here, not a rewrite.
const MIGRATIONS: &[(&str, &str)] = &[(
    "0001_create_snippets",
    include_str!("../../migrations/0001_create_snippets.sql"),
)];

pub fn run(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY);")?;

    for (name, sql) in MIGRATIONS {
        let already_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name = ?1)",
            [name],
            |row| row.get(0),
        )?;

        if !already_applied {
            conn.execute_batch(sql)?;
            conn.execute("INSERT INTO schema_migrations (name) VALUES (?1)", [name])?;
        }
    }

    Ok(())
}
