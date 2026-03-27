# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## NoteHub sharing and deployment notes

This project supports public share links for notes. A few important env variables and tips:

- `VITE_API_URL` — URL to the backend API (example: `https://api.example.com/api` or `http://localhost:5000/api`).
- `VITE_PUBLIC_URL` — Public URL of the frontend site (used to create canonical share links), e.g. `https://app.example.com`.

Share link format:

```
${VITE_PUBLIC_URL || window.location.origin}/share/{shareId}
```

The app supports both `/?shareId=...` query-style links and `/share/{shareId}` path-style links.

Deployment tips (Render / Vercel / Netlify):

1. Set `VITE_API_URL` and `VITE_PUBLIC_URL` in your hosting environment.
2. On the backend, set `PUBLIC_URL` to the frontend URL if you want canonical links returned by the API.
3. Configure CORS on the backend to allow your frontend origin.

If you want, I can add a small deploy checklist and a `makeShareUrl` helper usage example.
