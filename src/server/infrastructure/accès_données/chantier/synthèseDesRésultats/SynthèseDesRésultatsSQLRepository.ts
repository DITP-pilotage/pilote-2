import { synthese_des_resultats } from "@prisma/client";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import { CODES_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import SynthèseDesRésultats, {
  SyntheseDesResultatsV2,
} from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { Inject } from "@/server/legacy/module";

export class SynthèseDesRésultatsSQLRepository implements SynthèseDesRésultatsRepository {
  constructor(private readonly deps: Inject<"prisma">) {}

  get prisma() {
    return this.deps.prisma.getInstance();
  }

  async save({
    chantierId,
    territoireCode,
    id,
    contenu,
    meteo,
    auteurCreationId,
    dateCreation,
    auteurModificationId,
    dateModification,
    statut,
  }: SyntheseDesResultatsV2): Promise<void> {
    const { maille, codeInsee } =
      territoireCodeVersMailleCodeInsee(territoireCode);

    await this.prisma.synthese_des_resultats.upsert({
      where: { id },
      create: {
        id,
        chantier_id: chantierId,
        maille,
        code_insee: codeInsee,
        territoire_code: territoireCode,
        commentaire: contenu,
        meteo,
        auteur_creation_id: auteurCreationId,
        date_creation: new Date(dateCreation),
        auteur_modification_id: auteurModificationId,
        date_modification: new Date(dateModification),
        statut,
      },
      update: {
        commentaire: contenu,
        meteo,
        auteur_modification_id: auteurModificationId,
        date_modification: new Date(dateModification),
        statut,
      },
    });
  }

  async getById(id: string): Promise<SyntheseDesResultatsV2 | null> {
    const row = await this.prisma.synthese_des_resultats.findUnique({
      where: { id },
    });
    if (!row) return null;

    return {
      id: row.id,
      chantierId: row.chantier_id,
      territoireCode: row.territoire_code,
      contenu: row.commentaire ?? "",
      meteo: row.meteo as Météo,
      auteurCreationId: row.auteur_creation_id ?? "",
      dateCreation: row.date_creation.toISOString(),
      auteurModificationId: row.auteur_modification_id ?? "",
      dateModification: row.date_modification.toISOString(),
      statut: row.statut,
    };
  }

  async récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
    maille: Maille,
    codeInsee: CodeInsee,
  ): Promise<Record<Chantier["id"], SynthèseDesRésultats>> {
    const synthèsesDesRésultats = await this.prisma.$queryRaw<
      (synthese_des_resultats & { auteur_prenom: string; auteur_nom: string })[]
    >`
      SELECT s.*, utilisateur.prenom as auteur_prenom, utilisateur.nom as auteur_nom
      FROM synthese_des_resultats s
        LEFT JOIN utilisateur on utilisateur.id = s.auteur_modification_id
        INNER JOIN (
          SELECT chantier_id, maille, code_insee, MAX(date_modification) as maxdate
          FROM synthese_des_resultats
          WHERE chantier_id = ANY (${chantiersIds})
            AND maille = ${CODES_MAILLES[maille]}
            AND code_insee = ${codeInsee}
            AND statut = 'PUBLIE'
          GROUP BY chantier_id, maille, code_insee
        ) s_recentes
          ON s.date_modification = s_recentes.maxdate
            AND s.chantier_id = s_recentes.chantier_id
            AND s.maille = s_recentes.maille
            AND s.code_insee = s_recentes.code_insee
            AND s.statut = 'PUBLIE'
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
