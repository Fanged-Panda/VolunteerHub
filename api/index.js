import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { initDb } from './db.js';

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const GROQ_API_KEY = String(process.env.GROQ_API_KEY || '').trim();
const GROQ_MODEL = String(process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();
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
const CUET_STUDENT_EMAIL = /^(u\d+|admin)@student\.cuet\.ac\.bd$/i;
const PRIMARY_ADMIN_EMAIL = 'admin@student.cuet.ac.bd';
const MAX_PROFILE_IMAGE_PAYLOAD_BYTES = 62_000;

const app = express();

app.use(compression());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (origin === 'https://volunteer-hub-three.vercel.app') {
        return callback(null, true);
      }

      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }

      return callback(new Error('CORS not allowed for this origin.'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

function createToken(user, remember = false) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      club: user.club,
      coordinatorApproved: Boolean(user.coordinator_approved),
    },
    JWT_SECRET,
    { expiresIn: remember ? '30d' : '1d' },
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    club: user.club || '',
    department: user.department || '',
    profileImage: user.profile_image || '',
    coordinatorApproved: Boolean(user.coordinator_approved),
  };
}

function estimateDataUrlBytes(dataUrl) {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function roleRequired(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function parseAssignedTasks(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeAssignedTasks(rawTasks, fallbackCompleted = false) {
  if (!Array.isArray(rawTasks)) return [];

  return rawTasks
    .map((task) => {
      if (task && typeof task === 'object') {
        const title = String(task.title ?? task.task ?? '').trim();
        if (!title) return null;
        return {
          title,
          completed: Boolean(task.completed),
        };
      }

      const title = String(task || '').trim();
      if (!title) return null;
      return {
        title,
        completed: Boolean(fallbackCompleted),
      };
    })
    .filter(Boolean);
}

function summarizeRoleMix(usersByRole) {
  const counts = {
    volunteer: 0,
    coordinator: 0,
    admin: 0,
  };

  for (const row of usersByRole) {
    if (Object.hasOwn(counts, row.role)) counts[row.role] = row.count;
  }

  return counts;
}

function makeWebsiteContext({ counts, clubs, upcomingEvents }) {
  const clubList = clubs.slice(0, 12).join(', ') || 'No clubs configured yet.';
  const eventsText = upcomingEvents.length
    ? upcomingEvents
      .map((event) => `${event.title} on ${event.date} at ${event.location} (${event.club})`)
      .join('; ')
    : 'No events are currently listed.';

  return [
    'Product: VolunteerHub web app for CUET student volunteering activities.',
    'Primary pages: Home, Events, Login/Register, Volunteer Dashboard, Coordinator Dashboard, Admin Panel.',
    'Roles: volunteer, coordinator, admin.',
    `Current stats: ${counts.volunteer} volunteers, ${counts.coordinator} coordinators, ${counts.admin} admins.`,
    `Clubs: ${clubList}.`,
    `Upcoming events snapshot: ${eventsText}.`,
    'Volunteer abilities: browse events, apply/cancel, track assigned tasks, mark task completion.',
    'Coordinator abilities: create/edit events, review applications, approve/reject applicants, assign tasks, track attendance.',
    'Admin abilities: approve coordinator accounts, remove users, remove events, monitor totals.',
  ].join('\n');
}

function extractGroqText(data) {
  const firstChoice = Array.isArray(data?.choices) ? data.choices[0] : null;
  return String(firstChoice?.message?.content || '').trim();
}

async function sendMailMessage({ to, subject, text }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const mailUser = process.env.MAIL_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const mailAppPass = process.env.MAIL_APP_PASS || process.env.EMAIL_APP_PASS || process.env.GMAIL_APP_PASS;

  let transporter;
  let fromAddress;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    fromAddress = process.env.SMTP_FROM || smtpUser;
  } else if (mailUser && mailAppPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: mailUser, pass: mailAppPass },
    });
    fromAddress = process.env.SMTP_FROM || mailUser;
  } else {
    throw new Error(
      'Email service is not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS (optional SMTP_FROM), or MAIL_USER and MAIL_APP_PASS.',
    );
  }

  await transporter.sendMail({ from: fromAddress, to, subject, text });

  return { delivered: true, preview: null };
}

async function sendVerificationEmail(email, code) {
  return sendMailMessage({
    to: email,
    subject: 'VolunteerHub verification code',
    text: `Your VolunteerHub verification code is: ${code}`,
  });
}

async function sendPasswordResetEmail(email, code) {
  return sendMailMessage({
    to: email,
    subject: 'VolunteerHub password reset code',
    text: `Use this code to reset your VolunteerHub password: ${code}. This code expires in 10 minutes.`,
  });
}

const db = await initDb();

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/meta/clubs', async (req, res) => {
  const coordinatorRows = await db.all(
    "SELECT club FROM users WHERE role = 'coordinator' AND club IS NOT NULL AND TRIM(club) <> ''",
  );
  const usedClubs = new Set(coordinatorRows.map((row) => row.club));
  const availableCoordinatorClubs = CLUBS.filter((club) => !usedClubs.has(club));

  res.json({
    clubs: CLUBS,
    availableCoordinatorClubs,
  });
});

app.get('/api/meta/stats', async (req, res) => {
  const [roleCounts, coordinatorClubCount] = await Promise.all([
    db.all('SELECT role, COUNT(*) AS count FROM users GROUP BY role'),
    db.get(
      "SELECT COUNT(DISTINCT club) AS count FROM users WHERE role = 'coordinator' AND coordinator_approved = 1 AND club IS NOT NULL AND TRIM(club) <> ''",
    ),
  ]);

  const roleMap = Object.fromEntries((roleCounts || []).map((row) => [row.role, Number(row.count || 0)]));

  res.json({
    registeredVolunteers: Number(roleMap.volunteer || 0),
    registeredCoordinatorClubs: Number(coordinatorClubCount?.count || 0),
  });
});

app.post('/api/auth/request-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!CUET_STUDENT_EMAIL.test(normalizedEmail)) {
      return res.status(400).json({ error: "Use your CUET student email (uXXXXXXXX@student.cuet.ac.bd)." });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    const expires = now + 10 * 60 * 1000;

    await db.run('DELETE FROM verification_codes WHERE email = ?', normalizedEmail);
    await db.run(
      'INSERT INTO verification_codes (email, code, expires_at, created_at) VALUES (?, ?, ?, ?)',
      [normalizedEmail, code, expires, now],
    );

    await sendVerificationEmail(normalizedEmail, code);

    return res.json({ ok: true, message: 'Verification code sent.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to request verification.' });
  }
});

app.post('/api/auth/forgot-password/request', async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!CUET_STUDENT_EMAIL.test(normalizedEmail)) {
      return res.status(400).json({ error: "Use your CUET student email (uXXXXXXXX@student.cuet.ac.bd)." });
    }
    if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
      return res.status(400).json({ error: 'Password reset is disabled for the admin account.' });
    }

    const user = await db.get('SELECT id FROM users WHERE email = ?', normalizedEmail);
    if (user) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const now = Date.now();
      const expires = now + 10 * 60 * 1000;

      await db.run('DELETE FROM password_reset_codes WHERE email = ?', normalizedEmail);
      await db.run(
        'INSERT INTO password_reset_codes (email, code, expires_at, created_at) VALUES (?, ?, ?, ?)',
        [normalizedEmail, code, expires, now],
      );
      await sendPasswordResetEmail(normalizedEmail, code);
    }

    return res.json({
      ok: true,
      message: 'If an account exists for this email, a password reset code has been sent.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not request password reset.' });
  }
});

app.post('/api/auth/forgot-password/reset', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedCode = String(code || '').trim();

    if (!CUET_STUDENT_EMAIL.test(normalizedEmail)) {
      return res.status(400).json({ error: "Use your CUET student email (uXXXXXXXX@student.cuet.ac.bd)." });
    }
    if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
      return res.status(400).json({ error: 'Password reset is disabled for the admin account.' });
    }
    if (!normalizedCode) {
      return res.status(400).json({ error: 'Reset code is required.' });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const resetRecord = await db.get(
      'SELECT * FROM password_reset_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      normalizedEmail,
    );
    if (!resetRecord) {
      return res.status(400).json({ error: 'Request a password reset code first.' });
    }
    if (Date.now() > Number(resetRecord.expires_at || 0)) {
      return res.status(400).json({ error: 'Reset code expired. Request a new one.' });
    }
    if (String(resetRecord.code) !== normalizedCode) {
      return res.status(400).json({ error: 'Invalid reset code.' });
    }

    const user = await db.get('SELECT id FROM users WHERE email = ?', normalizedEmail);
    if (!user) {
      return res.status(400).json({ error: 'Account not found.' });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    await db.run('DELETE FROM password_reset_codes WHERE email = ?', normalizedEmail);

    return res.json({ ok: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not reset password.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, club, department, code } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedRole = role === 'coordinator' ? 'coordinator' : 'volunteer';
    const trimmedName = String(name || '').trim();
    const trimmedDepartment = String(department || '').trim();

    if (!CUET_STUDENT_EMAIL.test(normalizedEmail)) {
      return res.status(400).json({ error: "Use your CUET student email (uXXXXXXXX@student.cuet.ac.bd)." });
    }
    if (!trimmedName || trimmedName.length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (normalizedRole === 'volunteer' && !trimmedDepartment) {
      return res.status(400).json({ error: 'Department is required for volunteers.' });
    }

    const verification = await db.get(
      'SELECT * FROM verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      normalizedEmail,
    );
    if (!verification) return res.status(400).json({ error: 'Request verification code first.' });
    if (verification.code !== String(code || '').trim()) return res.status(400).json({ error: 'Invalid verification code.' });
    if (Date.now() > verification.expires_at) return res.status(400).json({ error: 'Verification code expired.' });

    if (normalizedRole === 'coordinator') {
      if (!club || !CLUBS.includes(club)) {
        return res.status(400).json({ error: 'Choose a valid club.' });
      }
      const existingCoordinator = await db.get(
        "SELECT id FROM users WHERE role = 'coordinator' AND club = ?",
        club,
      );
      if (existingCoordinator) {
        return res.status(400).json({ error: `A coordinator already exists for ${club}.` });
      }
    }

    const duplicate = await db.get('SELECT id FROM users WHERE email = ?', normalizedEmail);
    if (duplicate) return res.status(400).json({ error: 'Account already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const coordinatorApproved = normalizedRole === 'coordinator' ? 0 : 1;

    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role, club, department, coordinator_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        trimmedName,
        normalizedEmail,
        hash,
        normalizedRole,
        normalizedRole === 'coordinator' ? club : null,
        normalizedRole === 'volunteer' ? trimmedDepartment : null,
        coordinatorApproved,
        new Date().toISOString(),
      ],
    );

    await db.run('DELETE FROM verification_codes WHERE email = ?', normalizedEmail);

    const created = await db.get('SELECT * FROM users WHERE id = ?', result.lastID);
    const token = createToken(created, true);
    return res.json({ ok: true, user: sanitizeUser(created), token });
  } catch {
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

async function handleLogin(req, res) {
  try {
    const { email, username, password, remember } = req.body || {};
    const identifier = String(email || username || '').trim().toLowerCase();

    const user = await db.get('SELECT * FROM users WHERE email = ?', identifier);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    if (user.role === 'admin' && String(user.email || '').toLowerCase() !== PRIMARY_ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password || '', user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = createToken(user, Boolean(remember));
    return res.json({ ok: true, token, user: sanitizeUser(user) });
  } catch {
    return res.status(500).json({ error: 'Login failed.' });
  }
}

app.post('/api/auth/login', handleLogin);
// Compatibility alias for clients that post to /api/auth.
app.post('/api/auth', handleLogin);

app.get('/api/auth', (req, res) => {
  return res.status(405).json({ error: 'Method not allowed. Use POST /api/auth/login.' });
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ user: sanitizeUser(user) });
});

app.patch('/api/users/me/profile-image', authRequired, async (req, res) => {
  try {
    const rawProfileImage = String(req.body?.profileImage || '').trim();
    const profileImage = rawProfileImage || null;

    if (profileImage && !/^data:image\//i.test(profileImage)) {
      return res.status(400).json({ error: 'Profile image must be a valid image data URL.' });
    }
    if (profileImage && estimateDataUrlBytes(profileImage) > MAX_PROFILE_IMAGE_PAYLOAD_BYTES) {
      return res.status(400).json({ error: 'Profile image is too large. Please choose a smaller image.' });
    }

    await db.run('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, req.user.id]);
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not save profile image.' });
  }
});

app.get('/api/events', async (req, res) => {
  const rows = await db.all(
    `SELECT e.id, e.title, e.date, e.location, e.club, e.needed_volunteers AS neededVolunteers,
            e.image_url AS imageUrl, e.details,
            e.created_by AS createdBy, e.created_at AS createdAt,
            u.email AS createdByEmail,
            (
              SELECT COUNT(*)
              FROM applications a
              WHERE a.event_id = e.id AND a.status IN ('Applied', 'Approved')
            ) AS registeredVolunteers
     FROM events e
     LEFT JOIN users u ON u.id = e.created_by
     ORDER BY e.date ASC, e.id DESC`,
  );
  res.json({ events: rows });
});

app.get('/api/meta/top-contributors', async (req, res) => {
  const rows = await db.all(
    `SELECT u.id,
            u.name,
            u.email,
            u.club,
            u.department,
            COUNT(*) AS approvedApplications,
            COUNT(DISTINCT a.event_id) AS eventsParticipated,
            SUM(CASE WHEN a.attendance = 1 THEN 1 ELSE 0 END) AS attendanceCount,
            SUM(CASE WHEN a.task_completed = 1 THEN 1 ELSE 0 END) AS completedTasks,
            (
              COUNT(*) +
              SUM(CASE WHEN a.attendance = 1 THEN 1 ELSE 0 END) * 3 +
              SUM(CASE WHEN a.task_completed = 1 THEN 1 ELSE 0 END) * 2
            ) AS score
     FROM applications a
     JOIN users u ON u.id = a.volunteer_id
     WHERE a.status = 'Approved'
     GROUP BY u.id, u.name, u.email, u.club, u.department
     ORDER BY score DESC, attendanceCount DESC, approvedApplications DESC, u.id ASC
     LIMIT 6`,
  );

  res.json({ contributors: rows });
});

app.post('/api/events', authRequired, roleRequired('coordinator'), async (req, res) => {
  const owner = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!owner || !owner.coordinator_approved) {
    return res.status(403).json({ error: 'Coordinator account is waiting for admin approval.' });
  }

  const {
    title,
    date,
    location,
    club,
    needed_volunteers: neededVolunteersFromSchema,
    neededVolunteers,
    image_url: imageUrlFromSchema,
    imageUrl,
    details,
    created_by: createdByFromSchema,
  } = req.body || {};
  if (!title || !date || !location) {
    return res.status(400).json({ error: 'Title, date, and location are required.' });
  }

  const neededRaw = neededVolunteersFromSchema ?? neededVolunteers;
  const parsedNeeded = Number(neededRaw);
  const needed = Number.isInteger(parsedNeeded) && parsedNeeded > 0 ? parsedNeeded : 1;

  const resolvedClub = String(club ?? owner.club ?? '').trim();
  const resolvedImageUrl = String(imageUrlFromSchema ?? imageUrl ?? '').trim() || null;
  const resolvedDetails = String(details ?? '').trim() || null;
  const parsedCreatedBy = Number(createdByFromSchema);
  const resolvedCreatedBy = Number.isInteger(parsedCreatedBy)
    ? parsedCreatedBy
    : (owner?.id ?? null);

  const result = await db.run(
    `INSERT INTO events (title, date, location, club, needed_volunteers, image_url, details, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(title).trim(),
      String(date).trim(),
      String(location).trim(),
      resolvedClub,
      needed,
      resolvedImageUrl,
      resolvedDetails,
      resolvedCreatedBy,
    ],
  );

  const event = await db.get('SELECT * FROM events WHERE id = ?', result.lastID);
  res.json({ ok: true, event });
});

app.put('/api/events/:id', authRequired, roleRequired('coordinator'), async (req, res) => {
  const owner = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!owner || !owner.coordinator_approved) {
    return res.status(403).json({ error: 'Coordinator account is waiting for admin approval.' });
  }

  const event = await db.get('SELECT * FROM events WHERE id = ?', Number(req.params.id));
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.created_by !== owner.id) return res.status(403).json({ error: 'You can edit only your events.' });

  const {
    title,
    date,
    location,
    needed_volunteers: neededVolunteersFromSchema,
    neededVolunteers,
    image_url: imageUrlFromSchema,
    imageUrl,
    details,
  } = req.body || {};
  if (!title || !date || !location) {
    return res.status(400).json({ error: 'Title, date, and location are required.' });
  }
  const neededRaw = neededVolunteersFromSchema ?? neededVolunteers;
  const needed = Number(neededRaw);
  if (!Number.isInteger(needed) || needed < 1) {
    return res.status(400).json({ error: 'Volunteers needed must be at least 1.' });
  }

  await db.run(
    `UPDATE events
     SET title = ?, date = ?, location = ?, needed_volunteers = ?, image_url = ?, details = ?
     WHERE id = ?`,
    [
      String(title).trim(),
      String(date).trim(),
      String(location).trim(),
      needed,
      String(imageUrlFromSchema ?? imageUrl ?? '').trim() || null,
      String(details ?? '').trim() || null,
      event.id,
    ],
  );

  res.json({ ok: true });
});

app.post('/api/events/:id/apply', authRequired, roleRequired('volunteer'), async (req, res) => {
  const eventId = Number(req.params.id);
  const event = await db.get('SELECT id, title, date, needed_volunteers FROM events WHERE id = ?', eventId);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;
  if (event.date < todayKey) {
    return res.status(400).json({ error: 'This event date has passed.' });
  }

  const count = await db.get(
    `SELECT COUNT(*) AS count
     FROM applications
     WHERE event_id = ? AND status IN ('Applied', 'Approved')`,
    eventId,
  );
  if ((count?.count || 0) >= (event.needed_volunteers || 1)) {
    return res.status(400).json({ error: 'Volunteer slots are full for this event.' });
  }

  const existing = await db.get('SELECT * FROM applications WHERE event_id = ? AND volunteer_id = ?', [eventId, req.user.id]);
  if (existing && existing.status !== 'Rejected') {
    return res.status(400).json({ error: 'Already applied.' });
  }

  if (existing && existing.status === 'Rejected') {
    await db.run(
      `UPDATE applications
       SET status = 'Applied', assigned_task = '', assigned_tasks = '[]', attendance = 0, task_completed = 0, applied_at = ?, decision_at = NULL
       WHERE id = ?`,
      [new Date().toISOString(), existing.id],
    );
  } else {
    await db.run(
      `INSERT INTO applications (event_id, volunteer_id, status, assigned_task, assigned_tasks, attendance, task_completed, applied_at)
       VALUES (?, ?, 'Applied', '', '[]', 0, 0, ?)`,
      [eventId, req.user.id, new Date().toISOString()],
    );
  }

  res.json({ ok: true });
});

app.delete('/api/events/:id/application', authRequired, roleRequired('volunteer'), async (req, res) => {
  const eventId = Number(req.params.id);
  const existing = await db.get('SELECT * FROM applications WHERE event_id = ? AND volunteer_id = ?', [eventId, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Application not found.' });
  if (existing.status !== 'Applied') {
    return res.status(400).json({ error: 'Only pending applications can be canceled.' });
  }

  await db.run('DELETE FROM applications WHERE id = ?', existing.id);
  res.json({ ok: true });
});

app.get('/api/applications/my', authRequired, roleRequired('volunteer'), async (req, res) => {
  const rows = await db.all(
    `SELECT a.id, a.event_id AS eventId, a.status, a.assigned_task AS assignedTask, a.assigned_tasks AS assignedTasks,
            a.attendance, a.task_completed AS taskCompleted, a.applied_at AS appliedAt,
            a.decision_at AS decisionAt,
            e.title AS eventTitle, e.date AS eventDate, e.location AS eventLocation, e.club AS eventClub
     FROM applications a
     JOIN events e ON e.id = a.event_id
     WHERE a.volunteer_id = ?
     ORDER BY a.applied_at DESC`,
    req.user.id,
  );
  res.json({
    applications: rows.map((row) => ({
      ...(() => {
        const normalizedTasks = normalizeAssignedTasks(
          parseAssignedTasks(row.assignedTasks),
          Boolean(row.taskCompleted),
        );
        const completedTaskCount = normalizedTasks.filter((task) => task.completed).length;
        const allTasksCompleted = normalizedTasks.length > 0 && completedTaskCount === normalizedTasks.length;

        return {
          ...row,
          assignedTask: normalizedTasks.length
            ? normalizedTasks[normalizedTasks.length - 1].title
            : row.assignedTask,
          assignedTasks: normalizedTasks,
          completedTaskCount,
          totalTaskCount: normalizedTasks.length,
          attendance: Boolean(row.attendance),
          taskCompleted: normalizedTasks.length ? allTasksCompleted : Boolean(row.taskCompleted),
        };
      })(),
    })),
  });
});

app.patch('/api/applications/:id/task-completion', authRequired, roleRequired('volunteer'), async (req, res) => {
  const id = Number(req.params.id);
  const { taskCompleted, taskIndex } = req.body || {};
  const application = await db.get('SELECT * FROM applications WHERE id = ? AND volunteer_id = ?', [id, req.user.id]);
  if (!application) return res.status(404).json({ error: 'Application not found.' });
  if (application.status !== 'Approved') return res.status(400).json({ error: 'Only approved tasks can be updated.' });

  let nextTasks = normalizeAssignedTasks(
    parseAssignedTasks(application.assigned_tasks),
    Boolean(application.task_completed),
  );

  const hasTaskIndex = taskIndex !== undefined && taskIndex !== null && String(taskIndex).trim() !== '';
  const parsedTaskIndex = Number(taskIndex);

  if (nextTasks.length > 0) {
    if (!hasTaskIndex || !Number.isInteger(parsedTaskIndex) || parsedTaskIndex < 0 || parsedTaskIndex >= nextTasks.length) {
      return res.status(400).json({ error: 'A valid task index is required.' });
    }

    nextTasks[parsedTaskIndex] = {
      ...nextTasks[parsedTaskIndex],
      completed: Boolean(taskCompleted),
    };
  }

  const overallCompleted = nextTasks.length
    ? nextTasks.every((task) => task.completed)
    : Boolean(taskCompleted);

  await db.run('UPDATE applications SET assigned_tasks = ?, task_completed = ? WHERE id = ?', [
    JSON.stringify(nextTasks),
    overallCompleted ? 1 : 0,
    id,
  ]);

  res.json({ ok: true });
});

app.get('/api/coordinator/events', authRequired, roleRequired('coordinator'), async (req, res) => {
  const owner = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!owner) return res.status(401).json({ error: 'Unauthorized' });
  const rows = await db.all('SELECT * FROM events WHERE created_by = ? ORDER BY date DESC', owner.id);
  res.json({ approved: Boolean(owner.coordinator_approved), events: rows });
});

app.get('/api/coordinator/applications', authRequired, roleRequired('coordinator'), async (req, res) => {
  const owner = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!owner) return res.status(401).json({ error: 'Unauthorized' });

  const rows = await db.all(
    `SELECT a.id, a.status, a.assigned_task AS assignedTask, a.assigned_tasks AS assignedTasks, a.attendance, a.task_completed AS taskCompleted,
            a.event_id AS eventId, e.title AS eventTitle,
            u.email AS volunteerEmail, u.name AS volunteerName
     FROM applications a
     JOIN events e ON e.id = a.event_id
     JOIN users u ON u.id = a.volunteer_id
     WHERE e.created_by = ? AND a.status != 'Rejected'
     ORDER BY a.applied_at DESC`,
    owner.id,
  );

  res.json({
    approved: Boolean(owner.coordinator_approved),
    applications: rows.map((row) => ({
      ...(() => {
        const normalizedTasks = normalizeAssignedTasks(
          parseAssignedTasks(row.assignedTasks),
          Boolean(row.taskCompleted),
        );
        const completedTaskCount = normalizedTasks.filter((task) => task.completed).length;
        const allTasksCompleted = normalizedTasks.length > 0 && completedTaskCount === normalizedTasks.length;

        return {
          ...row,
          assignedTask: normalizedTasks.length
            ? normalizedTasks[normalizedTasks.length - 1].title
            : row.assignedTask,
          assignedTasks: normalizedTasks,
          completedTaskCount,
          totalTaskCount: normalizedTasks.length,
          attendance: Boolean(row.attendance),
          taskCompleted: normalizedTasks.length ? allTasksCompleted : Boolean(row.taskCompleted),
        };
      })(),
    })),
  });
});

app.patch('/api/applications/:id/status', authRequired, roleRequired('coordinator'), async (req, res) => {
  const owner = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!owner || !owner.coordinator_approved) {
    return res.status(403).json({ error: 'Coordinator account is waiting for admin approval.' });
  }

  const { status } = req.body || {};
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status update.' });
  }

  const row = await db.get(
    `SELECT a.id, a.status, e.created_by
     FROM applications a
     JOIN events e ON e.id = a.event_id
     WHERE a.id = ?`,
    Number(req.params.id),
  );
  if (!row) return res.status(404).json({ error: 'Application not found.' });
  if (row.created_by !== owner.id) return res.status(403).json({ error: 'Forbidden' });
  if (row.status !== 'Applied') return res.status(400).json({ error: 'Decision already finalized.' });

  await db.run(
    `UPDATE applications
     SET status = ?, decision_at = ?, assigned_task = CASE WHEN ? = 'Rejected' THEN '' ELSE assigned_task END,
         assigned_tasks = CASE WHEN ? = 'Rejected' THEN '[]' ELSE assigned_tasks END,
         attendance = CASE WHEN ? = 'Rejected' THEN 0 ELSE attendance END,
         task_completed = CASE WHEN ? = 'Rejected' THEN 0 ELSE task_completed END
     WHERE id = ?`,
    [status, new Date().toISOString(), status, status, status, status, row.id],
  );

  res.json({ ok: true });
});

app.patch('/api/applications/:id/assignment', authRequired, roleRequired('coordinator'), async (req, res) => {
  const owner = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!owner || !owner.coordinator_approved) {
    return res.status(403).json({ error: 'Coordinator account is waiting for admin approval.' });
  }

  const { addTask, attendance } = req.body || {};
  const row = await db.get(
    `SELECT a.id, a.status, a.assigned_tasks AS assignedTasks, a.task_completed AS taskCompleted, e.created_by
     FROM applications a
     JOIN events e ON e.id = a.event_id
     WHERE a.id = ?`,
    Number(req.params.id),
  );
  if (!row) return res.status(404).json({ error: 'Application not found.' });
  if (row.created_by !== owner.id) return res.status(403).json({ error: 'Forbidden' });
  if (row.status !== 'Approved') return res.status(400).json({ error: 'Only approved applicants can be assigned.' });

  let nextTasks = normalizeAssignedTasks(parseAssignedTasks(row.assignedTasks), Boolean(row.taskCompleted));

  if (addTask && String(addTask).trim()) {
    nextTasks.push({
      title: String(addTask).trim(),
      completed: false,
    });
  }

  const nextAttendance = typeof attendance === 'boolean' ? (attendance ? 1 : 0) : undefined;
  const lastTask = nextTasks.length ? nextTasks[nextTasks.length - 1].title : '';
  const overallCompleted = nextTasks.length ? nextTasks.every((task) => task.completed) : false;

  if (typeof nextAttendance === 'number') {
    await db.run(
      'UPDATE applications SET assigned_task = ?, assigned_tasks = ?, attendance = ?, task_completed = ? WHERE id = ?',
      [lastTask, JSON.stringify(nextTasks), nextAttendance, overallCompleted ? 1 : 0, row.id],
    );
  } else {
    await db.run(
      'UPDATE applications SET assigned_task = ?, assigned_tasks = ?, task_completed = ? WHERE id = ?',
      [lastTask, JSON.stringify(nextTasks), overallCompleted ? 1 : 0, row.id],
    );
  }

  res.json({ ok: true });
});

app.get('/api/admin/users', authRequired, roleRequired('admin'), async (req, res) => {
  const users = await db.all(
    `SELECT id, name, email, role, club, department, coordinator_approved AS coordinatorApproved, created_at AS createdAt
     FROM users
     WHERE NOT (role = 'coordinator' AND coordinator_approved = 0)
     ORDER BY id ASC`,
  );
  const pendingCoordinators = await db.all(
    `SELECT id, name, email, club, created_at AS createdAt
     FROM users
     WHERE role = 'coordinator' AND coordinator_approved = 0
     ORDER BY created_at DESC`,
  );
  const events = await db.get('SELECT COUNT(*) as count FROM events');
  const totalUsers = await db.get("SELECT COUNT(*) AS count FROM users WHERE role != 'admin'");
  res.json({
    users: users.map((u) => ({ ...u, coordinatorApproved: Boolean(u.coordinatorApproved) })),
    pendingCoordinators,
    totalUsers: totalUsers?.count || 0,
    totalEvents: events.count,
  });
});

app.patch('/api/admin/users/:id/approve-coordinator', authRequired, roleRequired('admin'), async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role !== 'coordinator') return res.status(400).json({ error: 'User is not a coordinator.' });

  const other = await db.get(
    "SELECT id FROM users WHERE role = 'coordinator' AND club = ? AND id != ? AND coordinator_approved = 1",
    [user.club, user.id],
  );
  if (other) return res.status(400).json({ error: `Another approved coordinator already exists for ${user.club}.` });

  await db.run('UPDATE users SET coordinator_approved = 1 WHERE id = ?', user.id);
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id/reject-coordinator', authRequired, roleRequired('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const user = await db.get('SELECT * FROM users WHERE id = ?', id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role !== 'coordinator') return res.status(400).json({ error: 'User is not a coordinator.' });
  if (user.coordinator_approved) {
    return res.status(400).json({ error: 'Coordinator is already approved.' });
  }

  await db.run('DELETE FROM users WHERE id = ?', id);
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', authRequired, roleRequired('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot remove your own admin account.' });

  const user = await db.get('SELECT * FROM users WHERE id = ?', id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (String(user.email || '').toLowerCase() === PRIMARY_ADMIN_EMAIL || user.role === 'admin') {
    return res.status(400).json({ error: 'Admin account cannot be removed.' });
  }

  await db.run('DELETE FROM users WHERE id = ?', id);
  res.json({ ok: true });
});

app.delete('/api/admin/events/:id', authRequired, roleRequired('admin'), async (req, res) => {
  const eventId = Number(req.params.id);
  const event = await db.get('SELECT id FROM events WHERE id = ?', eventId);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  await db.run('DELETE FROM events WHERE id = ?', eventId);
  res.json({ ok: true });
});

app.post('/api/chatbot/ask', async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    const todayKey = new Date().toISOString().slice(0, 10);
    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }
    if (question.length > 1200) {
      return res.status(400).json({ error: 'Question is too long. Please keep it under 1200 characters.' });
    }
    if (!GROQ_API_KEY) {
      return res.status(503).json({
        error: 'Chatbot is not configured. Set GROQ_API_KEY in your backend .env file.',
      });
    }

    const [usersByRole, clubsRows, upcomingEvents] = await Promise.all([
      db.all('SELECT role, COUNT(*) AS count FROM users GROUP BY role'),
      db.all("SELECT DISTINCT club FROM events WHERE club IS NOT NULL AND TRIM(club) != '' ORDER BY club ASC"),
      db.all(
        `SELECT title, date, location, club
         FROM events
         WHERE date >= ?
         ORDER BY date ASC, id DESC
         LIMIT 8`,
        [todayKey],
      ),
    ]);

    const counts = summarizeRoleMix(usersByRole || []);
    const clubs = (clubsRows || []).map((row) => row.club).filter(Boolean);
    const websiteContext = makeWebsiteContext({ counts, clubs, upcomingEvents: upcomingEvents || [] });

    const payload = {
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content: [
            'You are VolunteerHub assistant.',
            'Answer only questions related to this website and how users can use it.',
            'If the question is unrelated, politely say you can only help with VolunteerHub.',
            'Keep responses concise, practical, and factual.',
            'Format responses in clear markdown with short paragraphs and bullet points when useful.',
            'Do not invent unavailable features.',
          ].join(' '),
        },
        {
          role: 'user',
          content: `Website context:\n${websiteContext}\n\nUser question: ${question}`,
        },
      ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const upstreamError = data?.error?.message || 'Groq request failed.';
      return res.status(502).json({ error: upstreamError });
    }

    const answer = extractGroqText(data);
    if (!answer) {
      return res.status(502).json({ error: 'Groq returned an empty response.' });
    }

    return res.json({ ok: true, answer });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'Chatbot request timed out. Please try again.' });
    }
    return res.status(500).json({ error: err.message || 'Failed to process chatbot request.' });
  }
});

if (!IS_PRODUCTION) {
  app.listen(PORT, () => {
    console.log(`VolunteerHub API running on http://localhost:${PORT}`);
  });
}

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large. Please upload a smaller image.',
    });
  }
  return next(err);
});

export default app;
