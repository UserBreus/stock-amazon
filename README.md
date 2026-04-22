# Stock WMS

Aplicacion React + Vite para operacion de stock, ingresos, inventario y configuracion de maestros.

## Requisitos

- Node.js 20+

## Variables de entorno

Crea `.env.local` con:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"
```

La app usa ademas un proxy local de Vite y un rewrite de Vercel para enviar `/api/sql` al backend SQL configurado en [vite.config.ts](C:/Users/user2/Documents/tincho/stock/vite.config.ts:1) y [vercel.json](C:/Users/user2/Documents/tincho/stock/vercel.json:1).

## Desarrollo

```bash
npm install
npm run dev
```

## Verificacion

```bash
npm run lint
npm run build
```
