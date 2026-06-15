# Deployment & Troubleshooting Guide

This guide describes how to run the marketplace backend in a local WSL environment and deploy/troubleshoot the Next.js frontend across Cloudflare Pages and Hostinger Shared Webhosting.

---

## 1. Backend WSL Deployment

The backend runs inside WSL (Ubuntu-24.04) using a Docker Compose stack containing PHP 8.3 and PostgreSQL 16.

### Setup and Running the Stack
1. Ensure Docker is running in your WSL distribution.
2. From the project root directory, launch the WSL-configured compose file:
   ```bash
   docker compose -f infrastructure/docker-compose.wsl.yml up --build -d
   ```
3. This will spin up two containers:
   - `marketplace-db-wsl` (PostgreSQL database with schema and seed data auto-initialized).
   - `marketplace-backend-wsl` (PHP 8.3 Built-in HTTP Server running on port `8080`).

### Verifying the Backend & Row-Level Security (RLS)
The database is pre-seeded with two tenants:
- **Tenant 1**: `Apex Tech Labs` (`id: 11111111-1111-1111-1111-111111111111`)
- **Tenant 2**: `Luxe Attire` (`id: 22222222-2222-2222-2222-222222222222`)

You can verify RLS isolation by executing `curl` requests with the `X-Tenant-ID` header:

#### Query Tenant 1 (Apex Tech Labs)
```bash
curl -H "X-Tenant-ID: 11111111-1111-1111-1111-111111111111" http://localhost:8080/api/orders
```
**Expected Response** (Only ORD-APEX-001 and ORD-APEX-002 are returned):
```json
{
  "tenant_id": "11111111-1111-1111-1111-111111111111",
  "orders": [
    {
      "id": "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
      "tenant_id": "11111111-1111-1111-1111-111111111111",
      "order_number": "ORD-APEX-001",
      ...
    }
  ]
}
```

#### Query Tenant 2 (Luxe Attire)
```bash
curl -H "X-Tenant-ID: 22222222-2222-2222-2222-222222222222" http://localhost:8080/api/orders
```
**Expected Response** (Only ORD-LUXE-001 is returned):
```json
{
  "tenant_id": "22222222-2222-2222-2222-222222222222",
  "orders": [
    {
      "id": "b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "order_number": "ORD-LUXE-001",
      ...
    }
  ]
}
```

---

## 2. Frontend Dual-Target Deployment

To support deploying the Next.js frontend to both platforms, we use target-specific builds.

### Target A: Cloudflare Pages (Edge/Functions)
Cloudflare Pages compiles the Next.js app to execute on Edge Workers.
- **Build Command**: `npm run pages:build` (runs `npx @cloudflare/next-on-pages`)
- **Output Directory**: `.vercel/output`

### Target B: Hostinger Shared Webhosting (Static HTML Export)
Hostinger shared webhosting does not run Node.js/Edge servers reliably. We configure a **Static HTML Export** build.
- **Build Command**: `npm run build:hostinger`
- **Output Directory**: `frontend/out`
- **Configuration Modifications**:
  - Sets `output: 'export'` in `next.config.js` to disable server rendering.
  - Sets `images.unoptimized: true` to bypass image optimization requirements.
  - Registers `generateStaticParams()` in `[locale]/layout.tsx` to pre-compile dynamic locale paths during build.
- **Deployment**:
  - **Manual**: Copy all contents of `frontend/out/` directly into the `public_html` directory of your Hostinger shared hosting account via FTP or the Hostinger File Manager.
  - **Automated**: The GitHub Actions workflow automatically builds the project and uploads it to Hostinger via FTP on every push to `main`. To enable this, configure the following **Secrets** in your GitHub Repository settings (**Settings > Secrets and variables > Actions**):
    - `HOSTINGER_FTP_SERVER`: Your Hostinger FTP Host (e.g., `ftp.yourdomain.com`).
    - `HOSTINGER_FTP_USERNAME`: Your Hostinger FTP account username.
    - `HOSTINGER_FTP_PASSWORD`: Your Hostinger FTP account password.
    - `NEXT_PUBLIC_API_URL`: The public URL of your backend API (e.g., `https://api.yourdomain.com`).
