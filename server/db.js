import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLUBS = [
  'CUET Computer Club',
  'ASRRO',
  'Joydhoni',
  'IEEE CUET SB',
  'ASCE',
  'ASME',
  'CUET CAREER CLUB',
  'RMA',
  'CUET MUN',
];

async function ensureColumn(db, table, column, sqlTypeAndDefault) {
  const columns = await db.all(`PRAGMA table_info(${table})`);
  const exists = columns.some((col) => col.name === column);
  if (!exists) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqlTypeAndDefault}`);
  }
}

export async function initDb() {
  const isProduction = process.env.NODE_ENV === 'production';
  const enableDevSeed = !isProduction && process.env.ENABLE_DEV_SEED !== 'false';
  const bootstrapAdminEmail = String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const bootstrapAdminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();
  // Use Railway volume path if provided, otherwise keep a local file for development.
  const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'volunteerhub.db');

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log('Connected to SQLite at:', dbPath);

  await db.exec('PRAGMA foreign_keys = ON;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('volunteer', 'coordinator', 'admin')),
      club TEXT,
      department TEXT,
      coordinator_approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      club TEXT NOT NULL,
      needed_volunteers INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      category TEXT,
      summary TEXT,
      details TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Applied', 'Approved', 'Rejected')),
      assigned_task TEXT,
      assigned_tasks TEXT NOT NULL DEFAULT '[]',
      attendance INTEGER NOT NULL DEFAULT 0,
      task_completed INTEGER NOT NULL DEFAULT 0,
      applied_at TEXT NOT NULL,
      decision_at TEXT,
      UNIQUE(event_id, volunteer_id),
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(volunteer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await ensureColumn(db, 'events', 'needed_volunteers', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn(db, 'events', 'image_url', 'TEXT');
  await ensureColumn(db, 'applications', 'assigned_tasks', "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumn(db, 'users', 'department', 'TEXT');

  if (bootstrapAdminEmail && bootstrapAdminPassword) {
    const existingBootstrapAdmin = await db.get('SELECT id FROM users WHERE email = ?', bootstrapAdminEmail);
    if (!existingBootstrapAdmin) {
      const hash = await bcrypt.hash(bootstrapAdminPassword, 10);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role, club, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Admin User', bootstrapAdminEmail, hash, 'admin', null, 1, new Date().toISOString()],
      );
    }
  }

  if (enableDevSeed) {
    const adminEmail = 'admin@cuet.ac.bd';
    const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', adminEmail);
    if (!existingAdmin) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role, club, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Admin User', adminEmail, hash, 'admin', null, 1, new Date().toISOString()],
      );
    }

    const existingVolunteer = await db.get('SELECT id FROM users WHERE email = ?', 'u1000001@student.cuet.ac.bd');
    if (!existingVolunteer) {
      const hash = await bcrypt.hash('123456', 10);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role, club, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Student U1000001', 'u1000001@student.cuet.ac.bd', hash, 'volunteer', null, 1, new Date().toISOString()],
      );
    }

    const existingCoordinator = await db.get('SELECT id FROM users WHERE email = ?', 'u1000002@student.cuet.ac.bd');
    if (!existingCoordinator) {
      const hash = await bcrypt.hash('123456', 10);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role, club, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Student U1000002', 'u1000002@student.cuet.ac.bd', hash, 'coordinator', CLUBS[0], 1, new Date().toISOString()],
      );
    }

    const countEvents = await db.get('SELECT COUNT(*) as count FROM events');
    if (!countEvents || countEvents.count === 0) {
      const coordinator = await db.get('SELECT id, club FROM users WHERE email = ?', 'u1000002@student.cuet.ac.bd');
      await db.run(
        'INSERT INTO events (title, date, location, club, needed_volunteers, category, summary, details, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          'CP Workshop: Graph Theory',
          '2026-02-10',
          'Central Lab',
          coordinator?.club || CLUBS[0],
          30,
          'Workshop',
          'Master complex algorithms with top competitive programmers.',
          'Bring a laptop. Hands-on sessions with problem sets.',
          coordinator?.id || null,
          new Date().toISOString(),
        ],
      );
      await db.run(
        'INSERT INTO events (title, date, location, club, needed_volunteers, category, summary, details, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          'Robotics 101: Arduino',
          '2026-02-15',
          'WRE Workshop',
          'ASRRO',
          20,
          'Workshop',
          'Basics of hardware integration and sensor control.',
          'Tools and boards provided; limited seats.',
          null,
          new Date().toISOString(),
        ],
      );
    }
  }

  return db;
}
