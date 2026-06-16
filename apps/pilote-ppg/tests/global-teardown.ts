import { exec } from "child_process";

export default async function globalTeardown() {
  if (!process.env.CI) return;
  const port = new URL(process.env.BASE_URL!).port;
  await new Promise<void>((resolve) => {
    // fuser ne tue que le processus qui ÉCOUTE sur le port, pas les clients
    // (contrairement à lsof qui retourne aussi Playwright lui-même)
    exec(`fuser -k ${port}/tcp 2>/dev/null || true`, () => resolve());
  });
}
