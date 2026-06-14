# Cloudflare Pages & Tunnel Setup Guide

This guide details how to configure Cloudflare to host the Next.js frontend and securely connect it to the backend running on your private host.

---

## 1. Cloudflare Pages Setup (Frontend)

To build and deploy the Next.js app using Edge Runtime:
1. Go to the **Cloudflare Dashboard** -> **Workers & Pages**.
2. Click **Create** -> **Pages** -> **Connect to Git**.
3. Select your repository and configure the build settings:
   - **Framework preset**: `Next.js` (or leave as custom)
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output`
4. Under **Environment variables**, define:
   - `NEXT_PUBLIC_API_URL`: Set this to the public URL of your backend API (e.g., `https://api.yourdomain.com`).
5. Complete the setup. Cloudflare will automatically trigger builds on Git push.

---

## 2. GitHub Secrets Setup (CI/CD Auto-deployment)

To enable GitHub Actions to deploy directly to Cloudflare Pages:
1. Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token (generated under **My Profile** -> **API Tokens** with `Cloudflare Pages: Edit` permissions).
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (located on the right sidebar of your Cloudflare Account home page).
   - `NEXT_PUBLIC_API_URL`: Set to your public API URL (e.g., `https://api.yourdomain.com`).

---

## 3. Cloudflare Tunnel Setup (Backend Bridge)

Because the backend runs on Host B (a private local IP `192.168.8.59`), we use a Cloudflare Tunnel to expose it securely.

### Create the Tunnel
1. Go to the **Cloudflare Zero Trust** console.
2. Navigate to **Networks** -> **Tunnels** -> **Create a tunnel**.
3. Name it (e.g., `marketplace-backend-tunnel`) and click **Save**.
4. Copy the **Tunnel Token** (the long base64 string provided in the installation commands).

### Deploy the Tunnel Client
1. On Host B (or via your deployment environment), set the `CLOUDFLARE_TUNNEL_TOKEN` environment variable to the token value.
2. When the `cloudflared` service starts in `docker-compose.prod.yml`, it will authenticate using this token and connect to the Cloudflare edge.

### Map Public Hostname to Backend Service
1. In the Cloudflare Tunnel setup interface, go to the **Public Hostname** tab.
2. Click **Add a public hostname**.
3. Configure the mapping:
   - **Subdomain**: `api`
   - **Domain**: `yourdomain.com`
   - **Path**: (leave empty)
   - **Type**: `HTTP`
   - **URL**: `backend:8080` (this targets the `backend` service container on its internal docker network port)
4. Save the hostname.

---

## 4. Troubleshooting & Verification

- **DNS Records**: Cloudflare automatically adds a `CNAME` pointing `api.yourdomain.com` to the tunnel target.
- **CORS Configuration**: Ensure that the backend service accepts cross-origin requests from `https://marketplace-frontend.pages.dev` (or your custom frontend domain).
