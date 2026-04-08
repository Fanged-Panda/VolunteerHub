import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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
  const exists = await db.get(
    `SELECT 1 AS has_column
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [db.databaseName, table, column],
  );
  if (!exists) {
    await db.exec(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${sqlTypeAndDefault}`);
  }
}

async function ensureEventOwnerCascadeDelete(db) {
  const existingRule = await db.get(
    `SELECT DELETE_RULE AS deleteRule
     FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = 'events' AND CONSTRAINT_NAME = 'fk_events_created_by'
     LIMIT 1`,
    db.databaseName,
  );

  if (String(existingRule?.deleteRule || '').toUpperCase() === 'CASCADE') {
    return;
  }

  if (existingRule) {
    await db.exec(
      `ALTER TABLE \`events\` DROP FOREIGN KEY \`fk_events_created_by\`;
       ALTER TABLE \`events\`
       ADD CONSTRAINT \`fk_events_created_by\`
       FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );
    return;
  }

  const hasConstraint = await db.get(
    `SELECT COUNT(*) AS count
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND CONSTRAINT_NAME = 'fk_events_created_by'`,
    db.databaseName,
  );

  if (!hasConstraint?.count) {
    await db.exec(
      `ALTER TABLE \`events\`
       ADD CONSTRAINT \`fk_events_created_by\`
       FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );
  }
}

function normalizeParams(params) {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

function resolveMysqlConfig() {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim();

  if (databaseUrl && databaseUrl.toLowerCase().startsWith('mysql://')) {
    let parsed;
    try {
      parsed = new URL(databaseUrl);
    } catch {
      throw new Error('DATABASE_URL is invalid. Expected format: mysql://user:pass@host:3306/dbname');
    }

    return {
      host: parsed.hostname || process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(parsed.port || process.env.MYSQL_PORT || 3306),
      user: decodeURIComponent(parsed.username || process.env.MYSQL_USER || 'root'),
      password: decodeURIComponent(parsed.password || process.env.MYSQL_PASSWORD || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\/+/, '') || process.env.MYSQL_DATABASE || 'volunteerhub'),
      ssl: process.env.MYSQL_SSL === 'true'
        ? { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined,
    };
  }

  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'volunteerhub',
    ssl: process.env.MYSQL_SSL === 'true'
      ? { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined,
  };
}

async function createDatabaseIfMissing(config) {
  const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
          rejectUnauthorized: true
      }
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
}

function createDbAdapter(pool, databaseName) {
  return {
    databaseName,
    async get(sql, ...params) {
      const [rows] = await pool.query(sql, normalizeParams(params));
      return Array.isArray(rows) && rows.length ? rows[0] : undefined;
    },
    async all(sql, ...params) {
      const [rows] = await pool.query(sql, normalizeParams(params));
      return Array.isArray(rows) ? rows : [];
    },
    async run(sql, ...params) {
      const [result] = await pool.query(sql, normalizeParams(params));
      return {
        lastID: result?.insertId || 0,
        changes: result?.affectedRows || 0,
      };
    },
    async exec(sql) {
      const statements = sql
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await pool.query(statement);
      }
    },
    async close() {
      await pool.end();
    },
  };
}

function toMysqlTimestamp() {
  return new Date().toISOString();
}

function createSchemaSql() {
  return `
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('volunteer', 'coordinator', 'admin') NOT NULL,
      club VARCHAR(255),
      department VARCHAR(255),
      coordinator_approved TINYINT(1) NOT NULL DEFAULT 1,
      created_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS events (
      id INT NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      date VARCHAR(20) NOT NULL,
      location VARCHAR(255) NOT NULL,
      club VARCHAR(255) NOT NULL,
      needed_volunteers INT NOT NULL DEFAULT 1,
      image_url TEXT,
      category VARCHAR(255),
      summary TEXT,
      details TEXT,
      created_by INT,
      created_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_events_created_by (created_by),
      CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS applications (
      id INT NOT NULL AUTO_INCREMENT,
      event_id INT NOT NULL,
      volunteer_id INT NOT NULL,
      status ENUM('Applied', 'Approved', 'Rejected') NOT NULL,
      assigned_task TEXT,
      assigned_tasks LONGTEXT,
      attendance TINYINT(1) NOT NULL DEFAULT 0,
      task_completed TINYINT(1) NOT NULL DEFAULT 0,
      applied_at VARCHAR(64) NOT NULL,
      decision_at VARCHAR(64),
      PRIMARY KEY (id),
      UNIQUE KEY uq_applications_event_volunteer (event_id, volunteer_id),
      KEY idx_applications_event_id (event_id),
      KEY idx_applications_volunteer_id (volunteer_id),
      CONSTRAINT fk_applications_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_applications_volunteer FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INT NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(32) NOT NULL,
      expires_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      PRIMARY KEY (id),
      KEY idx_verification_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id INT NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(32) NOT NULL,
      expires_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      PRIMARY KEY (id),
      KEY idx_password_reset_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
}

export async function initDb() {
  const mysqlConfig = resolveMysqlConfig();
  if (!mysqlConfig.database) {
    throw new Error('MySQL database name is missing. Set DATABASE_URL or MYSQL_DATABASE.');
  }

  await createDatabaseIfMissing(mysqlConfig);

  const pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      ssl: {
          rejectUnauthorized: true // This is the magic key for TiDB!
      }
  });

  const db = createDbAdapter(pool, mysqlConfig.database);

  const isProduction = process.env.NODE_ENV === 'production';
  const enableDevSeed = !isProduction && process.env.ENABLE_DEV_SEED !== 'false';
  const bootstrapAdminEmail = String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const bootstrapAdminPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();

  await db.exec(createSchemaSql());
  await ensureColumn(db, 'events', 'needed_volunteers', 'INT NOT NULL DEFAULT 1');
  await ensureColumn(db, 'events', 'image_url', 'TEXT');
  await ensureColumn(db, 'applications', 'assigned_tasks', 'LONGTEXT');
  await ensureColumn(db, 'users', 'department', 'VARCHAR(255)');
  await ensureEventOwnerCascadeDelete(db);

  console.log(`Connected to MySQL at ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);

  if (bootstrapAdminEmail && bootstrapAdminPassword) {
    const existingBootstrapAdmin = await db.get('SELECT id FROM users WHERE email = ?', bootstrapAdminEmail);
    if (!existingBootstrapAdmin) {
      const hash = await bcrypt.hash(bootstrapAdminPassword, 10);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role, club, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Admin User', bootstrapAdminEmail, hash, 'admin', null, 1, toMysqlTimestamp()],
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
        ['Admin User', adminEmail, hash, 'admin', null, 1, toMysqlTimestamp()],
      );
    }

    const existingVolunteer = await db.get('SELECT id FROM users WHERE email = ?', 'u1000001@student.cuet.ac.bd');
    if (!existingVolunteer) {
      const hash = await bcrypt.hash('123456', 10);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role, club, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Student U1000001', 'u1000001@student.cuet.ac.bd', hash, 'volunteer', null, 1, toMysqlTimestamp()],
      );
    }

    const existingCoordinator = await db.get('SELECT id FROM users WHERE email = ?', 'u1000002@student.cuet.ac.bd');
    if (!existingCoordinator) {
      const hash = await bcrypt.hash('123456', 10);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role, club, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Student U1000002', 'u1000002@student.cuet.ac.bd', hash, 'coordinator', CLUBS[0], 1, toMysqlTimestamp()],
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
          toMysqlTimestamp(),
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
          toMysqlTimestamp(),
        ],
      );
    }
  }

  return db;
}
