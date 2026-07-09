CREATE TABLE snippets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    shortcut TEXT UNIQUE,
    position INTEGER NOT NULL
);
