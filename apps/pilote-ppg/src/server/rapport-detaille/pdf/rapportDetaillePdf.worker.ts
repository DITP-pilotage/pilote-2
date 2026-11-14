import { parentPort, workerData } from "node:worker_threads";
import {
  GenerateParams,
  renderRapportDetaillePdf,
} from "@/server/rapport-detaille/pdf/generateRapportDetaillePdf";

void renderRapportDetaillePdf(workerData as GenerateParams).then((pdf) =>
  parentPort?.postMessage(pdf, [pdf.buffer]),
);
