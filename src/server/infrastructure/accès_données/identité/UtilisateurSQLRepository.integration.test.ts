/* eslint-disable sonarjs/no-duplicate-string */
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/identité/UtilisateurSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';
import { créerProfilsEtHabilitations, InputUtilisateur } from '@/server/infrastructure/accès_données/identité/seed';
import { DIR_PROJET, DITP_PILOTAGE } from '@/server/domain/identité/Profil';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import HabilitationSQLRepository from '@/server/infrastructure/accès_données/identité/HabilitationSQLRepository';

const PROFIL_DITP_PILOTAGE = { code: DITP_PILOTAGE, nom: 'DITP - Pilotage', aAccesTousChantiers: true, habilitationScopeCodes:[SCOPE_LECTURE] };
const PROFIL_DIR_PROJET = { code: DIR_PROJET, nom: 'Directeur de projet', aAccesTousChantiers: false, habilitationScopeCodes:[SCOPE_LECTURE] };
const HABILITATION  = { code: SCOPE_LECTURE, nom: 'Lecture' };

describe('UtilisateurSQLRepository', () => {
  beforeEach(async () => {
    await créerProfilsEtHabilitations(prisma,
      [PROFIL_DITP_PILOTAGE, PROFIL_DIR_PROJET],
      [HABILITATION],
    );
  });

  it('crée des utilisateurs', async () => {
    // GIVEN
    const email = 'bob@example.com';
    const utilisateursÀCréer:InputUtilisateur[] = [
      { email, profilCode: DIR_PROJET, chantierIds: ['CH-001'] },
    ];
    // WHEN
    const repository:UtilisateurRepository = new UtilisateurSQLRepository(prisma);
    await repository.créerOuRemplaceUtilisateurs(utilisateursÀCréer);
    // THEN
    const result = await repository.getByEmail('bob@example.com');
    expect(result.email).toStrictEqual(email);
    const chantiers = await new HabilitationSQLRepository(prisma).récupèreAssociationsAvecChantier(email);
    expect(chantiers).toStrictEqual(['CH-001']);
  });

  it('remplace un utilisateur', async () => {
    // GIVEN
    const emailDeBob = 'bob@example.com';
    const emailDeJohn = 'john@example.com';
    const bobDirProjet = { email: emailDeBob, profilCode: DIR_PROJET, chantierIds: ['CH-001'] };
    const bobDitp = { email: emailDeBob, profilCode: DITP_PILOTAGE, chantierIds: [] };
    const johnDitp = { email: emailDeJohn, profilCode: DITP_PILOTAGE, chantierIds: [] };
    // WHEN
    const repository:UtilisateurRepository = new UtilisateurSQLRepository(prisma);
    await repository.créerOuRemplaceUtilisateurs([bobDirProjet]);
    const oldBob = await repository.getByEmail(emailDeBob);
    await repository.créerOuRemplaceUtilisateurs([bobDitp, johnDitp]);
    // THEN
    const newBob = await repository.getByEmail(emailDeBob);
    expect(newBob.profilId).not.toEqual(oldBob.profilId);
    const chantiersDeBob = await new HabilitationSQLRepository(prisma).récupèreAssociationsAvecChantier(emailDeBob);
    expect(chantiersDeBob).toStrictEqual([]);

    const john = await repository.getByEmail(emailDeJohn);
    expect(john).not.toBeFalsy();
  });
});
