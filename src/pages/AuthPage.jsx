import React, { useMemo, useState } from 'react';

const CUET_EMAIL_DOMAIN = 'student.cuet.ac.bd';
const CUET_EMAIL_HINT = `uxxxxxxx@${CUET_EMAIL_DOMAIN}`;
const STUDENT_ID_HINT = '';
const STUDENT_ID_PATTERN = /^\d{7}$/;
const DEPARTMENTS = ['CSE', 'EEE', 'CE', 'ME', 'IPE', 'URP', 'ChE', 'Architecture', 'WRE', 'Other'];

function autoCompleteCuetEmail(rawValue) {
  const raw = String(rawValue || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw.includes('@')) {
    const parts = raw.split('@');
    const local = parts[0] || '';
    const domain = parts.slice(1).join('@') || '';
    if (!domain || /^student(\.|$)/i.test(domain)) return `${local}@${CUET_EMAIL_DOMAIN}`;
    return raw;
  }

  const compact = raw.replace(/[^u0-9]/g, '');
  if (/^u?\d{1,7}$/i.test(compact)) {
    const digits = compact.replace(/^u/i, '');
    if (!digits) return '';
    return `u${digits}`;
  }

  return raw;
}

function finalizeCuetEmail(rawValue) {
  const raw = String(rawValue || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw.includes('@')) {
    const [local, domain = ''] = raw.split(/@(.+)/);
    if (!domain || /^student(\.|$)/i.test(domain)) return `${local}@${CUET_EMAIL_DOMAIN}`;
    return raw;
  }

  const compact = raw.replace(/[^u0-9]/g, '');
  if (/^u?\d{1,7}$/i.test(compact)) {
    const digits = compact.replace(/^u/i, '');
    if (!digits) return '';
    return `u${digits}`;
  }

  return raw;
}

function normalizeStudentId(rawValue) {
  const raw = String(rawValue || '').trim().toLowerCase();
  if (!raw) return '';
  const compact = raw.replace(/[^0-9]/g, '');
  const digits = compact.replace(/[^0-9]/g, '').slice(0, 7);
  if (!digits) return '';
  return digits;
}

function isValidStudentId(studentId) {
  return STUDENT_ID_PATTERN.test(String(studentId || '').trim());
}

function studentIdToEmail(studentId) {
  const normalized = normalizeStudentId(studentId);
  if (!isValidStudentId(normalized)) return '';
  return `u${normalized}@${CUET_EMAIL_DOMAIN}`;
}

export default function AuthPage({
  clubs = [],
  mode = 'login',
  onGoLogin = () => {},
  onGoRegister = () => {},
  onLogin,
  onRequestVerification,
  onRegister,
  onForgotPasswordRequest,
  onForgotPasswordReset,
}) {
  const isRegisterMode = mode === 'register';
  const coordinatorClubs = useMemo(() => Array.from(new Set(clubs.filter(Boolean))), [clubs]);
  const firstAvailableClub = coordinatorClubs[0] || '';

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    remember: true,
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    studentId: STUDENT_ID_HINT,
    password: '',
    role: 'volunteer',
    club: '',
    department: 'CSE',
    code: '',
  });

  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('request');
  const [forgotData, setForgotData] = useState({ email: '', code: '', newPassword: '' });
  const [registerStep, setRegisterStep] = useState('form');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedStudentId = normalizeStudentId(registerData.studentId);
  const generatedRegisterEmail = studentIdToEmail(normalizedStudentId);
  const effectiveCoordinatorClub = coordinatorClubs.includes(registerData.club)
    ? registerData.club
    : firstAvailableClub;

  async function submitLogin(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await onLogin(loginData);
    setLoading(false);
    if (!result?.ok) {
      setError(result?.error || 'Login failed.');
    }
  }

  async function requestForgotPasswordCode(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const email = forgotData.email.trim();
    if (!email) {
      setError('Enter your account email first.');
      return;
    }

    setLoading(true);
    const result = await onForgotPasswordRequest({ email });
    setLoading(false);

    if (!result?.ok) {
      setError(result?.error || 'Could not send reset code.');
      return;
    }

    setSuccess(result?.message || 'Reset code sent. Check your email.');
    setForgotStep('reset');
  }

  async function submitForgotPasswordReset(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotData.email.trim()) {
      setError('Enter your account email.');
      return;
    }
    if (!forgotData.code.trim()) {
      setError('Enter the reset code.');
      return;
    }
    if (forgotData.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await onForgotPasswordReset({
      email: forgotData.email.trim(),
      code: forgotData.code.trim(),
      newPassword: forgotData.newPassword,
    });
    setLoading(false);

    if (!result?.ok) {
      setError(result?.error || 'Could not reset password.');
      return;
    }

    setSuccess(result?.message || 'Password reset successful.');
    setShowForgotPassword(false);
    setForgotStep('request');
    setForgotData({ email: forgotData.email.trim(), code: '', newPassword: '' });
    setLoginData((prev) => ({ ...prev, email: forgotData.email.trim(), password: '' }));
  }

  async function requestVerificationCode(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!registerData.name.trim() || registerData.name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }
    if (!isValidStudentId(normalizedStudentId)) {
      setError('Enter a valid student ID (7 digits).');
      return;
    }
    if (!generatedRegisterEmail) {
      setError('Could not generate your CUET email from student ID.');
      return;
    }
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (registerData.role === 'coordinator' && !effectiveCoordinatorClub) {
      setError('No coordinator club is currently available.');
      return;
    }

    setLoading(true);
    const result = await onRequestVerification({ email: generatedRegisterEmail });
    setLoading(false);

    if (!result?.ok) {
      setError(result?.error || 'Failed to send verification code.');
      return;
    }

    setRegisterData((prev) => ({
      ...prev,
      studentId: normalizedStudentId,
      club: prev.role === 'coordinator'
        ? (coordinatorClubs.includes(prev.club) ? prev.club : firstAvailableClub)
        : prev.club,
    }));
    setSuccess('Verification code sent to your CUET email.');
    setRegisterStep('verify');
  }

  async function submitRegister(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isValidStudentId(normalizedStudentId)) {
      setError('Enter a valid student ID (7 digits).');
      return;
    }
    if (!generatedRegisterEmail) {
      setError('Could not generate your CUET email from student ID.');
      return;
    }
    if (!registerData.code.trim()) {
      setError('Enter the verification code.');
      return;
    }

    setLoading(true);
    const result = await onRegister({
      name: registerData.name.trim(),
      email: generatedRegisterEmail,
      password: registerData.password,
      role: registerData.role,
      club: registerData.role === 'coordinator' ? effectiveCoordinatorClub : '',
      department: registerData.role === 'volunteer' ? registerData.department : '',
      code: registerData.code.trim(),
    });
    setLoading(false);

    if (!result?.ok) {
      setError(result?.error || 'Registration failed.');
      return;
    }

    if (!result?.token) {
      setSuccess('Registration complete. Login now.');
      setRegisterStep('form');
      setRegisterData({
        name: '',
        studentId: '',
        password: '',
        role: 'volunteer',
        club: firstAvailableClub,
        department: 'CSE',
        code: '',
      });
      onGoLogin();
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm lg:grid-cols-2">
        <section className="rounded-2xl bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
            {isRegisterMode ? 'Registration' : 'Login'}
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {isRegisterMode
              ? 'Register using your CUET student ID. Your CUET email is auto-generated from that ID.'
              : 'Login with your CUET account. Coordinators require admin approval for coordinator dashboard access.'}
          </p>

          {isRegisterMode ? (
            <div className="mt-5 space-y-2 text-sm text-slate-700">
              <p className="font-bold">How registration works:</p>
              <p>Register through your cuet student mail</p>
              <p>There can be only one coordinator per club</p>
            </div>
          ) : (
            <div className="mt-5 space-y-2 text-sm text-slate-700">
              <p className="font-bold">Demo accounts:</p>
              <p>Volunteer: volunteer@{CUET_EMAIL_DOMAIN}</p>
              <p>Coordinator: coordinator@{CUET_EMAIL_DOMAIN}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 p-5">
          {!isRegisterMode ? (
            <>
              <form onSubmit={submitLogin} className="space-y-3" autoComplete="on">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Email or Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    autoComplete="username"
                    value={loginData.email}
                    onBlur={() => setLoginData((prev) => ({ ...prev, email: finalizeCuetEmail(prev.email) }))}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, email: autoCompleteCuetEmail(e.target.value) }))}
                    placeholder={CUET_EMAIL_HINT}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    value={loginData.password}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={loginData.remember}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, remember: e.target.checked }))}
                  />
                  Keep me logged in on this browser
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setShowForgotPassword((prev) => !prev);
                    setForgotStep('request');
                    setForgotData((prev) => ({
                      ...prev,
                      email: loginData.email.trim() || prev.email,
                      code: '',
                      newPassword: '',
                    }));
                  }}
                  className="text-left text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  Forgot password?
                </button>

                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                {success && <p className="text-sm font-semibold text-emerald-700">{success}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className="text-sm text-slate-600">
                  Need an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setShowForgotPassword(false);
                      setForgotStep('request');
                      setRegisterStep('form');
                      onGoRegister();
                    }}
                    className="font-bold text-orange-600 hover:text-orange-700"
                  >
                    Register here
                  </button>
                </p>
              </form>

              {showForgotPassword && (
                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.08em] text-orange-800">Reset Password</h3>

                  {forgotStep === 'request' ? (
                    <form onSubmit={requestForgotPasswordCode} className="mt-3 space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Account Email</label>
                        <input
                          type="text"
                          required
                          value={forgotData.email}
                          onChange={(e) => setForgotData((prev) => ({ ...prev, email: autoCompleteCuetEmail(e.target.value) }))}
                          onBlur={() => setForgotData((prev) => ({ ...prev, email: finalizeCuetEmail(prev.email) }))}
                          placeholder={CUET_EMAIL_HINT}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? 'Sending...' : 'Send Reset Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={submitForgotPasswordReset} className="mt-3 space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Account Email</label>
                        <input
                          type="text"
                          required
                          value={forgotData.email}
                          onChange={(e) => setForgotData((prev) => ({ ...prev, email: autoCompleteCuetEmail(e.target.value) }))}
                          onBlur={() => setForgotData((prev) => ({ ...prev, email: finalizeCuetEmail(prev.email) }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Reset Code</label>
                        <input
                          type="text"
                          required
                          value={forgotData.code}
                          onChange={(e) => setForgotData((prev) => ({ ...prev, code: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">New Password</label>
                        <input
                          type="password"
                          required
                          value={forgotData.newPassword}
                          onChange={(e) => setForgotData((prev) => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForgotStep('request')}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                        >
                          {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {registerStep === 'form' ? (
                <form onSubmit={requestVerificationCode} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={registerData.name}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">CUET Student ID</label>
                      <input
                        type="text"
                        required
                        value={registerData.studentId}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, studentId: normalizeStudentId(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                  </div>

                  {/* Generated email is handled in background; do not display it in the form. */}

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">Role</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterData((prev) => ({ ...prev, role: 'volunteer' }))}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${registerData.role === 'volunteer' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        Volunteer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterData((prev) => ({
                          ...prev,
                          role: 'coordinator',
                          club: coordinatorClubs.includes(prev.club) ? prev.club : firstAvailableClub,
                        }))}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${registerData.role === 'coordinator' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        Coordinator
                      </button>
                    </div>
                  </div>

                  {registerData.role === 'coordinator' ? (
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Club </label>
                      {coordinatorClubs.length > 0 ? (
                        <select
                          value={effectiveCoordinatorClub}
                          onChange={(e) => setRegisterData((prev) => ({ ...prev, club: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        >
                          {coordinatorClubs.map((club) => (
                            <option key={club} value={club}>{club}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          No coordinator club is currently available.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Department</label>
                      <select
                        value={registerData.department}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        {DEPARTMENTS.map((department) => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                  {success && <p className="text-sm font-semibold text-emerald-700">{success}</p>}

                  <button
                    type="submit"
                    disabled={loading || (registerData.role === 'coordinator' && coordinatorClubs.length === 0)}
                    className="w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                  >
                    {loading ? 'Sending code...' : 'Send Verification Code'}
                  </button>

                  <p className="text-sm text-slate-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccess('');
                        setRegisterStep('form');
                        onGoLogin();
                      }}
                      className="font-bold text-orange-600 hover:text-orange-700"
                    >
                      Login here
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={submitRegister} className="space-y-3">
                  <p className="text-sm text-slate-600">Verification code sent to your CUET email.</p>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">Verification Code</label>
                    <input
                      type="text"
                      required
                      value={registerData.code}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, code: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                  {success && <p className="text-sm font-semibold text-emerald-700">{success}</p>}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegisterStep('form')}
                      className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                    >
                      {loading ? 'Verifying...' : 'Verify & Register'}
                    </button>
                  </div>

                  <p className="text-sm text-slate-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccess('');
                        setRegisterStep('form');
                        onGoLogin();
                      }}
                      className="font-bold text-orange-600 hover:text-orange-700"
                    >
                      Login here
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
