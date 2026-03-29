import React, { useMemo, useState } from 'react';

const defaultAccounts = [
  { name: 'Volunteer Demo', email: 'volunteer@cuet.ac.bd', password: '123456', role: 'volunteer' },
  { name: 'Coordinator Demo', email: 'coordinator@cuet.ac.bd', password: '123456', role: 'coordinator' },
  { name: 'Admin Demo', email: 'admin@cuet.ac.bd', password: 'admin123', role: 'admin' },
];

export default function AuthPage({ users = [], onLogin, onRegister }) {
  const [tab, setTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', role: 'volunteer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allUsers = useMemo(() => [...defaultAccounts, ...users], [users]);

  function submitLogin(e) {
    e.preventDefault();
    setError('');

    const foundUser = allUsers.find(
      (user) => user.email.toLowerCase() === loginData.email.toLowerCase().trim() && user.password === loginData.password,
    );

    if (!foundUser) {
      setError('Invalid email or password.');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      onLogin(foundUser);
    }, 700);
  }

  function submitRegister(e) {
    e.preventDefault();
    setError('');

    if (registerData.name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }
    if (!registerData.email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (allUsers.some((user) => user.email.toLowerCase() === registerData.email.toLowerCase().trim())) {
      setError('An account with this email already exists.');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      onRegister({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        role: registerData.role,
      });
    }, 700);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm lg:grid-cols-2">
        <section className="rounded-2xl bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Authentication</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Login or Register</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Register as a volunteer or coordinator. After login, dashboards and pages are shown based on your role.
          </p>

          <div className="mt-5 space-y-2 text-sm text-slate-700">
            <p className="font-bold">Demo accounts:</p>
            <p>Volunteer: volunteer@cuet.ac.bd / 123456</p>
            <p>Coordinator: coordinator@cuet.ac.bd / 123456</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Register
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={submitLogin} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitRegister} className="space-y-3">
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
                <label className="mb-1 block text-sm font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={registerData.password}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Role</label>
                <select
                  value={registerData.role}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="coordinator">Coordinator</option>
                </select>
              </div>

              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
