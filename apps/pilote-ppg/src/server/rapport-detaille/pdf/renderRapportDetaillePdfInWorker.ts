import { Worker } from "node:worker_threads";
import { GenerateParams } from "@/server/rapport-detaille/pdf/generateRapportDetaillePdf";

const WORKER_HEAP_LIMIT_MB = 256;
const GENERATION_TIMEOUT_MS = 90_000;

export function renderRapportDetaillePdfInWorker(
  params: GenerateParams,
): Promise<Uint8Array> {
  const worker = new Worker(
    new URL("./rapportDetaillePdf.worker.ts", import.meta.url),
    {
      workerData: params,
      resourceLimits: { maxOldGenerationSizeMb: WORKER_HEAP_LIMIT_MB },
    },
  );
  let timeout: NodeJS.Timeout | undefined;
  return new Promise<Uint8Array>((resolve, reject) => {
    timeout = setTimeout(
      () =>
        reject(
          new Error(
            `Génération du PDF interrompue après ${GENERATION_TIMEOUT_MS} ms`,
          ),
        ),
      GENERATION_TIMEOUT_MS,
    );
    worker.once("message", (pdf: Uint8Array) => resolve(pdf));
    worker.once("error", reject);
    worker.once("exit", (code) =>
      reject(new Error(`Worker PDF arrêté avec le code ${code}`)),
    );
  }).finally(() => {
    clearTimeout(timeout);
    void worker.terminate();
  });
}
