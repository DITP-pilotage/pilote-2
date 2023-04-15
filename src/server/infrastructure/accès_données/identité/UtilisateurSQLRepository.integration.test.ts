import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/identité/UtilisateurSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';
import { créerProfilsEtHabilitations, InputUtilisateur } from '@/server/infrastructure/accès_données/identité/seed';
import { DITP_PILOTAGE } from '@/server/domain/identité/Profil';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';

describe('UtilisateurSQLRepository', () => {
  it('crée des utilisateurs', async () => {
    // GIVEN
    const email = 'bob@example.com';
    await créerProfilsEtHabilitations(prisma, [
      { code: DITP_PILOTAGE, nom: 'DITP - Pilotage', aAccesTousChantiers: true, habilitationScopeCodes:[SCOPE_LECTURE] },
    ], [
      { code: SCOPE_LECTURE, nom: 'Lecture' },
    ]);
    const utilisateursÀCréer:InputUtilisateur[] = [
      { email, profilCode: DITP_PILOTAGE, chantierIds: [] },
    ];
    // WHEN
    const repository:UtilisateurRepository = new UtilisateurSQLRepository(prisma);
    await repository.créerUtilisateurs(utilisateursÀCréer);
    // THEN
    const result = await repository.findOneByEmail('bob@example.com');
    expect(result?.email).toStrictEqual(email);
  });
});
