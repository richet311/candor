// The Worker that serves the built client. Static files and page navigations are answered from
// assets without running any of this (see wrangler.jsonc); what's here is the scheduled keep-warm
// ping, plus a pass-through for the odd request that matches no file.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  API_HEALTH_URL: string;
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },

  // Render's free tier spins the API down after 15 minutes without traffic, and the next visitor
  // waits up to a minute for it to come back. Pinging more often than that keeps it up. The health
  // route doesn't touch the database, so Neon can still scale to zero between real visits.
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    const startedAt = Date.now();
    const res = await fetch(env.API_HEALTH_URL);
    console.log(`keep-warm ping: ${res.status} after ${Date.now() - startedAt}ms`);
    // Throwing marks the run as failed in the Cloudflare dashboard, which is where you'd look.
    if (!res.ok) throw new Error(`API health check returned ${res.status}`);
  },
};
