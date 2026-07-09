use std::path::Path;
use std::sync::Mutex;

use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use crate::domain::{AppError, NewSnippet, Snippet, SnippetUpdate};

use super::migrations;
use super::SnippetRepository;

pub struct SqliteSnippetRepository {
    conn: Mutex<Connection>,
}

impl SqliteSnippetRepository {
    pub fn new(path: &Path) -> Result<Self, AppError> {
        let conn = Connection::open(path).map_err(storage_err)?;
        migrations::run(&conn).map_err(storage_err)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    #[cfg(test)]
    fn in_memory() -> Self {
        let conn = Connection::open_in_memory().expect("open in-memory sqlite");
        migrations::run(&conn).expect("run migrations");
        Self {
            conn: Mutex::new(conn),
        }
    }
}

fn storage_err(err: rusqlite::Error) -> AppError {
    AppError::Internal(err.to_string())
}

/// Constraint violations on write are, in this schema, always the `shortcut`
/// UNIQUE constraint (name/content are just NOT NULL) — surfaced as a
/// friendly, specific error instead of a generic storage failure.
fn write_err(err: rusqlite::Error) -> AppError {
    if let rusqlite::Error::SqliteFailure(ref sqlite_err, _) = err {
        if sqlite_err.code == rusqlite::ErrorCode::ConstraintViolation {
            return AppError::DuplicateShortcut;
        }
    }
    storage_err(err)
}

fn row_to_snippet(row: &Row) -> rusqlite::Result<Snippet> {
    Ok(Snippet {
        id: row.get("id")?,
        name: row.get("name")?,
        content: row.get("content")?,
        shortcut: row.get("shortcut")?,
        position: row.get("position")?,
    })
}

const SELECT_COLUMNS: &str = "id, name, content, shortcut, position";

impl SnippetRepository for SqliteSnippetRepository {
    fn list(&self) -> Result<Vec<Snippet>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare(&format!(
                "SELECT {SELECT_COLUMNS} FROM snippets ORDER BY position ASC"
            ))
            .map_err(storage_err)?;
        let rows = stmt.query_map([], row_to_snippet).map_err(storage_err)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(storage_err)
    }

    fn create(&self, new: NewSnippet) -> Result<Snippet, AppError> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let position = next_position(&conn)?;

        conn.execute(
            "INSERT INTO snippets (id, name, content, shortcut, position) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, new.name, new.content, new.shortcut, position],
        )
        .map_err(write_err)?;

        Ok(Snippet {
            id,
            name: new.name,
            content: new.content,
            shortcut: new.shortcut,
            position,
        })
    }

    fn update(&self, id: &str, update: SnippetUpdate) -> Result<Snippet, AppError> {
        let conn = self.conn.lock().unwrap();
        let changed = conn
            .execute(
                "UPDATE snippets SET name = ?1, content = ?2, shortcut = ?3 WHERE id = ?4",
                params![update.name, update.content, update.shortcut, id],
            )
            .map_err(write_err)?;

        if changed == 0 {
            return Err(AppError::NotFound);
        }

        conn.query_row(
            &format!("SELECT {SELECT_COLUMNS} FROM snippets WHERE id = ?1"),
            params![id],
            row_to_snippet,
        )
        .map_err(storage_err)
    }

    fn delete(&self, id: &str) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        let changed = conn
            .execute("DELETE FROM snippets WHERE id = ?1", params![id])
            .map_err(storage_err)?;

        if changed == 0 {
            return Err(AppError::NotFound);
        }
        Ok(())
    }

    fn duplicate(&self, id: &str) -> Result<Snippet, AppError> {
        let conn = self.conn.lock().unwrap();
        let original = conn
            .query_row(
                &format!("SELECT {SELECT_COLUMNS} FROM snippets WHERE id = ?1"),
                params![id],
                row_to_snippet,
            )
            .optional()
            .map_err(storage_err)?
            .ok_or(AppError::NotFound)?;

        let new_id = Uuid::new_v4().to_string();
        let position = next_position(&conn)?;
        let name = format!("{} (copy)", original.name);

        // Shortcuts intentionally do not carry over to the copy: the UNIQUE
        // constraint would reject it anyway, and pasting to the wrong
        // snippet because two entries shared a hotkey would be worse than
        // asking the user to assign a new one.
        conn.execute(
            "INSERT INTO snippets (id, name, content, shortcut, position) VALUES (?1, ?2, ?3, NULL, ?4)",
            params![new_id, name, original.content, position],
        )
        .map_err(storage_err)?;

        Ok(Snippet {
            id: new_id,
            name,
            content: original.content,
            shortcut: None,
            position,
        })
    }
}

fn next_position(conn: &Connection) -> Result<i64, AppError> {
    conn.query_row(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM snippets",
        [],
        |row| row.get(0),
    )
    .map_err(storage_err)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn new_snippet(name: &str, shortcut: Option<&str>) -> NewSnippet {
        NewSnippet {
            name: name.to_string(),
            content: format!("{name} content"),
            shortcut: shortcut.map(str::to_string),
        }
    }

    #[test]
    fn create_and_list_preserves_order() {
        let repo = SqliteSnippetRepository::in_memory();
        repo.create(new_snippet("First", Some("Alt+1"))).unwrap();
        repo.create(new_snippet("Second", Some("Alt+2"))).unwrap();

        let snippets = repo.list().unwrap();
        assert_eq!(snippets.len(), 2);
        assert_eq!(snippets[0].name, "First");
        assert_eq!(snippets[1].name, "Second");
    }

    #[test]
    fn duplicate_shortcut_is_rejected_with_friendly_error() {
        let repo = SqliteSnippetRepository::in_memory();
        repo.create(new_snippet("First", Some("Alt+1"))).unwrap();

        let err = repo.create(new_snippet("Second", Some("Alt+1"))).unwrap_err();
        assert!(matches!(err, AppError::DuplicateShortcut));
    }

    #[test]
    fn multiple_snippets_can_have_no_shortcut() {
        let repo = SqliteSnippetRepository::in_memory();
        repo.create(new_snippet("First", None)).unwrap();
        repo.create(new_snippet("Second", None)).unwrap();

        assert_eq!(repo.list().unwrap().len(), 2);
    }

    #[test]
    fn update_changes_fields_and_returns_the_new_state() {
        let repo = SqliteSnippetRepository::in_memory();
        let created = repo.create(new_snippet("First", Some("Alt+1"))).unwrap();

        let updated = repo
            .update(
                &created.id,
                SnippetUpdate {
                    name: "Renamed".to_string(),
                    content: "New content".to_string(),
                    shortcut: Some("Alt+2".to_string()),
                },
            )
            .unwrap();

        assert_eq!(updated.name, "Renamed");
        assert_eq!(updated.content, "New content");
        assert_eq!(updated.shortcut, Some("Alt+2".to_string()));
    }

    #[test]
    fn update_missing_snippet_returns_not_found() {
        let repo = SqliteSnippetRepository::in_memory();
        let err = repo
            .update(
                "does-not-exist",
                SnippetUpdate {
                    name: "x".to_string(),
                    content: "x".to_string(),
                    shortcut: None,
                },
            )
            .unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    }

    #[test]
    fn delete_removes_snippet() {
        let repo = SqliteSnippetRepository::in_memory();
        let created = repo.create(new_snippet("First", None)).unwrap();

        repo.delete(&created.id).unwrap();
        assert_eq!(repo.list().unwrap().len(), 0);
    }

    #[test]
    fn delete_missing_snippet_returns_not_found() {
        let repo = SqliteSnippetRepository::in_memory();
        let err = repo.delete("does-not-exist").unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    }

    #[test]
    fn duplicate_copies_content_but_not_shortcut() {
        let repo = SqliteSnippetRepository::in_memory();
        let created = repo.create(new_snippet("First", Some("Alt+1"))).unwrap();

        let copy = repo.duplicate(&created.id).unwrap();
        assert_eq!(copy.name, "First (copy)");
        assert_eq!(copy.content, created.content);
        assert_eq!(copy.shortcut, None);
        assert_ne!(copy.id, created.id);
    }
}
