# Configuration Supabase Auth — DITONA Engineering

These values are configured in the Supabase dashboard and cannot be changed by the browser application.

1. Open **Authentication → URL Configuration**
2. Set **Site URL** to the public HTTPS address of DITONA Engineering
3. Add these redirect URLs, replacing the domain with the public site domain:
   - `https://your-ditona-domain.example/reset-password`
   - `https://your-ditona-domain.example/login`
   - `http://localhost:5173/reset-password` only for local development
4. In the deployment environment, set `VITE_PUBLIC_SITE_URL` to the same public HTTPS address and redeploy
5. Open **Authentication → Email Templates** and rename the subjects and the visible brand to **DITONA Engineering**. Use the recovery template for the reset-password e-mail and keep its confirmation URL variable unchanged

If the current Site URL is `http://localhost:3030`, Supabase will send visitors there whenever a requested redirect is not allow-listed. Updating the Site URL and redirect allow-list is therefore required in addition to the code change.
