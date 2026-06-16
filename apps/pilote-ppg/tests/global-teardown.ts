import { exec } from "child_process";

export default async function globalTeardown() {
  const port = new URL(process.env.BASE_URL!).port;
  await new Promise<void>((resolve) => {
    exec(
      `lsof -ti:${port} | xargs kill -9 2>/dev/null || fuser -k ${port}/tcp 2>/dev/null || true`,
      () => resolve(),
    );
  });
}
