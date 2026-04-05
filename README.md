# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Production Deployment Notes

Before deploying, copy `.env.example` to `.env` and set real values.

Required production settings:

- `NODE_ENV=production`
- `JWT_SECRET` as a long random secret
- `CORS_ORIGIN` with your frontend URL(s)
- SMTP or Gmail app-password variables for verification email

Recommended production settings:

- `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` to create the first admin account once
- Keep `ENABLE_DEV_SEED=false` in production

Security behavior in production:

- Cross-origin requests are restricted to `CORS_ORIGIN`
- No hardcoded admin shortcut login exists
- Demo users/events are not auto-seeded unless explicitly enabled
