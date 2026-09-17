import { Readable } from "node:stream";
import { NextApiRequest, NextApiResponse } from "next";
import { createResponse } from "node-mocks-http";

const FRONTIERE = "----frontiereImportPilote";

/**
 * Construit une vraie requête HTTP que formidable sait lire : un flux lisible
 * plus les en-têtes qui vont avec. `node-mocks-http` ne sait pas produire de
 * corps multipart, mais rien n'oblige à passer par lui pour la requête — seule
 * la réponse a besoin de ses accesseurs de test.
 */
function construireRequete(
  corps: Buffer,
  enTetes: Record<string, string>,
  {
    sessionToken,
    indicateurId,
  }: { sessionToken?: string; indicateurId: string },
): NextApiRequest {
  const requete = Readable.from([corps]) as unknown as NextApiRequest;

  requete.method = "POST";
  requete.query = { indicateurId };
  requete.headers = {
    "content-length": String(corps.length),
    ...enTetes,
    // next-auth v5 lit les cookies depuis le header "cookie", pas req.cookies
    ...(sessionToken ? { cookie: `authjs.session-token=${sessionToken}` } : {}),
  };
  requete.cookies = sessionToken
    ? { "authjs.session-token": sessionToken }
    : {};

  return requete;
}

export function requeteMultipart({
  contenu,
  nomDuFichier,
  indicateurId,
  sessionToken,
}: {
  contenu: Buffer;
  nomDuFichier: string;
  indicateurId: string;
  sessionToken?: string;
}) {
  const corps = Buffer.concat([
    Buffer.from(
      `--${FRONTIERE}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${nomDuFichier}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`,
    ),
    contenu,
    Buffer.from(`\r\n--${FRONTIERE}--\r\n`),
  ]);

  return {
    request: construireRequete(
      corps,
      { "content-type": `multipart/form-data; boundary=${FRONTIERE}` },
      { sessionToken, indicateurId },
    ),
    response: createResponse<NextApiResponse>(),
  };
}

export function requeteJson({
  donnees,
  indicateurId,
  sessionToken,
}: {
  donnees: unknown;
  indicateurId: string;
  sessionToken?: string;
}) {
  const corps = Buffer.from(JSON.stringify(donnees));

  return {
    request: construireRequete(
      corps,
      { "content-type": "application/json" },
      { sessionToken, indicateurId },
    ),
    response: createResponse<NextApiResponse>(),
  };
}
