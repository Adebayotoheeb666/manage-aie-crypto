import type { RequestHandler } from "express";

export const handleEnvJs: RequestHandler = (_req, res) => {
  const publicEnv: Record<string, string | undefined> = {
    VITE_SUPABASE_URL:
      process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY:
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // Never expose service role or other server-only secrets here
  delete (publicEnv as any).NEXT_SUPABASE_SERVICE_ROLE_KEY;
  delete (publicEnv as any).SUPABASE_SERVICE_ROLE_KEY;

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );

  const payload = `window.__env__ = Object.assign(window.__env__ || {}, ${JSON.stringify(
    publicEnv,
  )});`;

  res.status(200).send(payload);
};
