import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import {
  créerRouteurTRPC,
  procédureProtégée,
} from "@/server/infrastructure/api/trpc/trpc";
import { Albert } from "@/server/albert/Albert";

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
  
  Règles d’analyse :
  - Un territoire de niveau supérieur ne doit pas masquer des risques critiques répétés sur des sous-territoires
  - Les incohérences entre niveaux doivent être explicitement signalées
  - Tu distingues clairement :
    - Les constats factuels
    - Les interprétations analytiques
    - Les alertes de gouvernance
  
  Contraintes :
  - Tu raisonnes uniquement à partir des données fournies
  - Tu ne supposes jamais d’informations absentes
  - Tu hiérarchises les risques par criticité (faible / modéré / élevé)
  - Ton ton est factuel, synthétique et orienté décision
  
  Tu produis une synthèse exploitable par une direction de programme ou un comité de pilotage.
`;

export const albertRouter = créerRouteurTRPC({
  chat: procédureProtégée
    .input(
      z.object({
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const listeSyntheseResultat =
        await prisma.synthese_des_resultats.findMany({
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
      return Albert.generateText({
        prompt: input.prompt.replace(
          "{{LISTE_DES_SYNTHESES}}",
          JSON.stringify(listeSyntheseResultat),
        ),
        systemPrompt,
        userId: ctx.session.user.id,
      });
    }),
});
