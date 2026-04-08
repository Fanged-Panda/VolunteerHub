import React, { useState } from 'react';

const CUET_EMAIL_HINT = 'uXXXXXXXX@student.cuet.ac.bd';
const CUET_EMAIL_DOMAIN = '@student.cuet.ac.bd';

function autoCompleteCuetEmail(rawValue) {
  const raw = String(rawValue || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'admin') return raw;
  if (raw.includes('@')) return raw;

  if (/^\d{1,7}$/.test(raw)) {
    const candidate = `u${raw}`;
    return raw.length === 7 ? `${candidate}${CUET_EMAIL_DOMAIN}` : candidate;
  }

  if (/^u\d{1,7}$/.test(raw)) {
    return raw.length === 8 ? `${raw}${CUET_EMAIL_DOMAIN}` : raw;
  }

  return raw;
}

function finalizeCuetEmail(rawValue) {
  const candidate = autoCompleteCuetEmail(rawValue);
  if (/^u\d{7}$/.test(candidate)) return `${candidate}${CUET_EMAIL_DOMAIN}`;
  return candidate;
}

export default function AuthPage({ clubs = [], onLogin, onRequestVerification, onRegister, onForgotPasswordRequest, onForgotPasswordReset }) {
  const [tab, setTab] = useState('login');
  const departments = ['CSE', 'EEE', 'CE', 'ME', 'IPE', 'URP', 'ChE', 'Architecture', 'WRE', 'Other'];

  const [loginData, setLoginData] = useState({ email: '', password: '', remember: true });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'volunteer',
    club: clubs[0] || '',
    department: departments[0],
    code: '',
  });

  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('request');
  const [forgotData, setForgotData] = useState({ email: '', code: '', newPassword: '' });
  const [registerStep, setRegisterStep] = useState('form');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    if (!registerData.email.trim()) {
      setError('Enter your CUET student email first.');
      return;
    }
    if (!registerData.name.trim() || registerData.name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (registerData.role === 'coordinator' && !registerData.club) {
      setError('Select a club for coordinator registration.');
      return;
    }

    setLoading(true);
    const result = await onRequestVerification({ email: registerData.email.trim() });
    setLoading(false);

    if (!result?.ok) {
      setError(result?.error || 'Failed to send verification code.');
      return;
    }

    setSuccess('Verification code sent to your email. Enter the code to complete registration.');
    setRegisterStep('verify');
  }

  async function submitRegister(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!registerData.code.trim()) {
      setError('Enter the verification code.');
      return;
    }

    setLoading(true);
    const result = await onRegister({
      name: registerData.name.trim(),
      email: registerData.email.trim(),
      password: registerData.password,
      role: registerData.role,
      club: registerData.role === 'coordinator' ? registerData.club : '',
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
        email: '',
        password: '',
        role: 'volunteer',
        club: clubs[0] || '',
        department: departments[0],
        code: '',
      });
      setTab('login');
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm lg:grid-cols-2">
        <section className="rounded-2xl bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Authentication</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Login or Register</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Only CUET student emails are accepted. Coordinator accounts need admin approval before coordinator access.
          </p>

          <div className="mt-5 space-y-2 text-sm text-slate-700">
            <p className="font-bold">Demo accounts:</p>
            <p>Volunteer: u1000001@student.cuet.ac.bd / 123456</p>
            <p>Coordinator: u1000002@student.cuet.ac.bd / 123456</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => { setTab('login'); setShowForgotPassword(false); setError(''); setSuccess(''); }}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setTab('register'); setShowForgotPassword(false); setError(''); setSuccess(''); }}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Register
            </button>
          </div>

          {tab === 'login' ? (
            <>
              <form onSubmit={submitLogin} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Email or Username</label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={loginData.email}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, email: autoCompleteCuetEmail(e.target.value) }))}
                    onBlur={() => setLoginData((prev) => ({ ...prev, email: finalizeCuetEmail(prev.email) }))}
                    placeholder={`${CUET_EMAIL_HINT} or admin`}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">Tip: type only the 7 digits (for example 1000001) and we auto-complete your CUET email.</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">Password</label>
                  <input
                    type="password"
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
                    setForgotData((prev) => ({ ...prev, email: loginData.email.trim() || prev.email, code: '', newPassword: '' }));
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
                    <label className="mb-1 block text-sm font-bold text-slate-700">CUET Student Email</label>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={registerData.email}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, email: autoCompleteCuetEmail(e.target.value) }))}
                      onBlur={() => setRegisterData((prev) => ({ ...prev, email: finalizeCuetEmail(prev.email) }))}
                      placeholder={CUET_EMAIL_HINT}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                    <p className="mt-1 text-xs text-slate-500">Enter 7 digits or start with u; the domain is filled automatically.</p>
                  </div>

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

                  <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">Role</label>
                    <select
                      value={registerData.role}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          role: e.target.value,
                          club: e.target.value === 'coordinator' ? (prev.club || clubs[0] || '') : '',
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                      <option value="volunteer">Volunteer</option>
                      <option value="coordinator">Coordinator</option>
                    </select>
                  </div>

                  {registerData.role === 'coordinator' && (
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Club</label>
                      <select
                        value={registerData.club}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, club: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        {clubs.map((club) => (
                          <option key={club} value={club}>{club}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {registerData.role === 'volunteer' && (
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Department</label>
                      <select
                        value={registerData.department}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        {departments.map((department) => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                  {success && <p className="text-sm font-semibold text-emerald-700">{success}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                  >
                    {loading ? 'Sending code...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitRegister} className="space-y-3">
                  <p className="text-sm text-slate-600">Code sent to {registerData.email}</p>

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
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
