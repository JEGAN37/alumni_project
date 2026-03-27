# Backend deployment notes

Set these environment variables in your hosting environment (Render, Vercel serverless function, etc.):

- PORT — server port (usually provided by the host)
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME — MySQL connection
- JWT_SECRET — JWT signing secret
- PUBLIC_URL — public URL of the frontend (e.g. https://app.example.com). If set, the API will return canonical share links when a note is shared.
- CORS_ORIGIN — optional comma-separated list of allowed origins for CORS (or configure CORS in code)

CORS example (Express):

```js
const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => { if(!origin) return cb(null, true); if(allowed.length === 0) return cb(null, true); return allowed.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS')); } }));
```

When you create a share on the backend, the response will include `shareId` and `shareLink` if `PUBLIC_URL` is set (or fallback to `http://localhost:5173/share/{shareId}`).
