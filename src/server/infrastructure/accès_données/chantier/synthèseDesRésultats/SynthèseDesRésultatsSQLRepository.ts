import { synthese_des_resultats } from "@prisma/client";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import SynthèseDesRésultats, {
  SynthèseDesRésultatsV2,
} from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { prisma } from "@/server/db/prisma";

export class SynthèseDesRésultatsSQLRepository implements SynthèseDesRésultatsRepository {
  async save({
    chantierId,
    territoireCode,
    id,
    contenu,
    météo,
    auteur_creation_id,
    date_creation,
    auteur_modification_id,
    date_modification,
  }: SynthèseDesRésultatsV2): Promise<void> {
    const { maille, codeInsee } =
      territoireCodeVersMailleCodeInsee(territoireCode);

    await prisma.synthese_des_resultats.upsert({
      where: { id },
      create: {
        id,
        chantier_id: chantierId,
        maille,
        code_insee: codeInsee,
        territoire_code: territoireCode,
        commentaire: contenu,
        meteo: météo,
        auteur_creation_id,
        date_creation: new Date(date_creation),
        auteur_modification_id,
        date_modification: new Date(date_modification),
      },
      update: {
        commentaire: contenu,
        meteo: météo,
        auteur_modification_id,
        date_modification: new Date(date_modification),
      },
    });
  }

  async récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
    maille: Maille,
    codeInsee: CodeInsee,
  ): Promise<Record<Chantier["id"], SynthèseDesRésultats>> {
    const synthèsesDesRésultats = await prisma.$queryRaw<
      (synthese_des_resultats & { auteur_prenom: string; auteur_nom: string })[]
    >`
      SELECT s.*, utilisateur.prenom as auteur_prenom, utilisateur.nom as auteur_nom
      FROM synthese_des_resultats s
        LEFT JOIN utilisateur on utilisateur.id = s.auteur_id
        INNER JOIN (
          SELECT chantier_id, maille, code_insee, MAX(date_commentaire) as maxdate
          FROM synthese_des_resultats
          WHERE chantier_id = ANY (${chantiersIds})
            AND maille = ${CODES_MAILLES[maille]}
            AND code_insee = ${codeInsee}
          GROUP BY chantier_id, maille, code_insee
        ) s_recentes
          ON s.date_commentaire = s_recentes.maxdate
            AND s.chantier_id = s_recentes.chantier_id
            AND s.maille = s_recentes.maille
            AND s.code_insee = s_recentes.code_insee
      `;

    return Object.fromEntries(
      synthèsesDesRésultats.map((synthèseDesRésultats) => [
        synthèseDesRésultats.chantier_id,
        {
          id: synthèseDesRésultats.id,
          contenu: synthèseDesRésultats.commentaire ?? "",
          date: synthèseDesRésultats.date_modification?.toISOString() ?? "",
          auteur: synthèseDesRésultats.auteur_modification_id
            ? `${synthèseDesRésultats.auteur_prenom} ${synthèseDesRésultats.auteur_nom}`
            : "Auteur Inconnu",
          météo: (synthèseDesRésultats.meteo as Météo) ?? "NON_RENSEIGNEE",
        },
      ]),
    );
  }
}
