import { exec } from "child_process";

export default async function globalTeardown() {
  if (!process.env.CI) return;
  const port = new URL(process.env.BASE_URL!).port;
  await new Promise<void>((resolve) => {
    // pkill cible next-server par nom de process (indépendant IPv4/IPv6)
    // ss en fallback pour trouver le PID via le port (gère IPv4 et IPv6)
    // eslint-disable-next-line sonarjs/os-command
    exec(
      `pkill -9 -f "next-server" 2>/dev/null; ss -tlnp 'sport = :${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u | xargs -r kill -9 2>/dev/null; true`,
      { shell: "/bin/bash" },
      () => resolve(),
    );
  });
}
