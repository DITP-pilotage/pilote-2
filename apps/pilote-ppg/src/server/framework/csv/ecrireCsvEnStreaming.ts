import { Stringifier } from "csv-stringify";
import { ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const estFermetureClient = (erreur: unknown): boolean =>
  (erreur as NodeJS.ErrnoException | null)?.code ===
  "ERR_STREAM_PREMATURE_CLOSE";

export async function ecrireCsvEnStreaming(
  lignes: AsyncIterable<string[]> | Iterable<string[]>,
  stringifier: Stringifier,
  response: ServerResponse,
): Promise<void> {
  try {
    await pipeline(Readable.from(lignes), stringifier, response);
  } catch (erreur) {
    if (estFermetureClient(erreur) || response.destroyed) {
      return;
    }
    throw erreur;
  }
}
