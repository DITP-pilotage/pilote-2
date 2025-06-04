import { UtilisateurRepository } from '@/server/chantiers/domain/ports/UtilisateurRepository';
import { Utilisateur } from '@/server/chantiers/domain/Utilisateur';
import { prisma } from '@/server/db/prisma';

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  async recupererUtilisateursParProfilEtChantierIds(profilCode: string, listeChantierIds: string[]): Promise<Utilisateur[]> {
    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        profilCode: profilCode,
        date_desactivation: null,
        habilitation: {
          some: {
            scopeCode: 'lecture',
            chantiers: {
              hasSome: listeChantierIds,
            },
          },
        },
      },
      include: {
        habilitation: true,
      },
    });
    return utilisateurs.map(utilisateur => Utilisateur.creerUtilisateur({
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      listeChantiers: utilisateur.habilitation.find(habilitation => habilitation.scopeCode === 'lecture')?.chantiers ?? [],
    }));
  }
}
