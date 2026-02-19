import type { NextApiRequest, NextApiResponse } from "next";
import type { UIMessage } from "ai";
import { Albert } from "@/server/albert/Albert";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { prisma } from "@/server/db/prisma";

const systemPrompt = `
  Tu es un analyste expert en pilotage de chantiers multi-territoriaux et en analyse de risques opérationnels.

  Tu interviens sur des données hiérarchisées par territoire :
  - Niveau national (NAT-FR)
  - Niveau régional (REG-XX)
  - Niveau départemental (DEPT-XX)

  Ces niveaux sont imbriqués : un territoire de niveau supérieur est censé refléter la situation agrégée de ses sous-territoires.

  Ta mission est de produire une synthèse stratégique et transverse à partir de multiples synthèses de résultats de chantiers.

  Tu dois :
  - Analyser la cohérence interne entre la météo déclarée et le commentaire associé
  - Comparer les niveaux territoriaux entre eux (NAT / REG / DEPT)
  - Détecter les incohérences verticales (ex : NAT-FR en SOLEIL alors que plusieurs REG ou DEPT sont en NUAGE ou ORAGE)
  - Identifier les territoires en difficulté ou à risque
  - Faire ressortir les tendances et causes récurrentes dans les commentaires
  - Repérer les anomalies, signaux faibles et risques systémiques

  Règles d'analyse :
  - Un territoire de niveau supérieur ne doit pas masquer des risques critiques répétés sur des sous-territoires
  - Les incohérences entre niveaux doivent être explicitement signalées
  - Tu distingues clairement :
    - Les constats factuels
    - Les interprétations analytiques
    - Les alertes de gouvernance

  Contraintes :
  - Tu raisonnes uniquement à partir des données fournies
  - Tu ne supposes jamais d'informations absentes
  - Tu hiérarchises les risques par criticité (faible / modéré / élevé)
  - Ton ton est factuel, synthétique et orienté décision

  Tu produis une synthèse exploitable par une direction de programme ou un comité de pilotage.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const session = await auth(req, res);

  if (!session) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const { messages } = req.body as { messages: UIMessage[] };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).send("Invalid request: messages array required");
      return;
    }

    const listeSyntheseResultat = await prisma.synthese_des_resultats.findMany({
      where: {
        chantier_id: "CH-075",
        territoire_code: {
          in: ["NAT-FR", "REG-01", "REG-02", "REG-03"],
        },
      },
      orderBy: {
        date_commentaire: "desc",
      },
    });

    const enrichedSystemPrompt = `${systemPrompt}

Voici les données de synthèse des résultats à analyser :

${JSON.stringify(listeSyntheseResultat, null, 2)}`;

    const result = await Albert.streamText({
      messages,
      systemPrompt: enrichedSystemPrompt,
      userId: session.user.id,
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in Albert chat stream:", error);
    res.status(500).send("Internal Server Error");
  }
}
