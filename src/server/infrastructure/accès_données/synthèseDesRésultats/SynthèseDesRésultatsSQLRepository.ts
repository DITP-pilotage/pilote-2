import { synthese_des_resultats, PrismaClient } from '@prisma/client';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export class SynthèseDesRésultatsSQLRepository implements SynthèseDesRésultatsRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async créer(chantierId: string, maille: Maille, codeInsee: CodeInsee, id: string, contenu: string, auteur: string, météo: Météo, date: Date): Promise<SynthèseDesRésultats> {
    const synthèseDesRésultats =  await this.prisma.synthese_des_resultats.create({
      data: {
        id: id,
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        commentaire: contenu,
        meteo: météo,
        date_commentaire: date,
        date_meteo: date,
        auteur: auteur,
      } });
    return this.mapperVersDomaine(synthèseDesRésultats);
  }

  private mapperVersDomaine(synthèse: synthese_des_resultats | null): SynthèseDesRésultats {
    if (synthèse === null || synthèse.commentaire === null || synthèse.date_commentaire === null)
      return null;

    return {
      id: synthèse.id,
      contenu: synthèse.commentaire,
      date: synthèse.date_commentaire.toISOString(),
      auteur: synthèse.auteur ?? '',
      météo: synthèse.meteo as Météo ?? 'NON_RENSEIGNEE',
    };
  }
  
  async récupérerLaPlusRécente(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats> {
    const synthèseDesRésultats = await this.prisma.synthese_des_resultats.findFirst({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        NOT: [
          {
            commentaire: null,
          },
          {
            date_commentaire: null,
          },
        ],
      },
      orderBy: { date_commentaire: 'desc' },
    });

    return this.mapperVersDomaine(synthèseDesRésultats);
  }

  async récupérerHistorique(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats[]> {
    const synthèsesDesRésultats = await this.prisma.synthese_des_resultats.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
      orderBy: { date_commentaire: 'desc' },
    });

    return synthèsesDesRésultats
      .map((synthèse: synthese_des_resultats) => this.mapperVersDomaine(synthèse))
      .filter((synthèse: SynthèseDesRésultats) => synthèse !== null);
  }

  async récupérerLesPlusRécentesGroupéesParChantier(maille: Maille, codeInsee: CodeInsee) {
    const synthèsesDesRésultats = await this.prisma.$queryRaw<synthese_des_resultats[]>`
      select s.*
      from synthese_des_resultats s
      where maille = ${CODES_MAILLES[maille]}
      and code_insee = ${codeInsee}   
      and s.id IN (
          select id
          from synthese_des_resultats
          where chantier_id = s.chantier_id
            and code_insee = s.code_insee
            and maille = s.maille
          order by date_commentaire desc
          limit 1
      )
    `;    

    return Object.fromEntries(
      synthèsesDesRésultats.map(synthèseDesRésultats => (
        [
          synthèseDesRésultats.chantier_id,
          this.mapperVersDomaine(synthèseDesRésultats),
        ]
      )),
    );
  }
}
