import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/chantier/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  test('Premier test', async () => {
    const createdDate = '2022-07-05T00:00:00.000Z';

    const résultatAttendu = {
      commentaireSynthèse: {
        contenu: 'Le suivi de l’indicateur relatif à la protection Animale...',
        date: new Date(createdDate).toLocaleDateString('fr-FR'),
      },
    };

    await prisma.synthese_des_resultats.create({
      data: {
        chantier_id: 'CH-001',
        commentaire: résultatAttendu.commentaireSynthèse.contenu,
        date_commentaire: createdDate,
        maille: 'NAT',
        code_insee: 'FR',
      },
    });

    const repository = new SynthèseDesRésultatsSQLRepository(prisma);
    const result = await repository.findNewestByChantierId('CH-001');
    expect(result).toStrictEqual(résultatAttendu);
  });

  test('Une ligne avec date de commentaire mais sans commentaire est sautée', async () => {
    const createdDate = '2022-07-05T00:00:00.000Z';

    const résultatAttendu = {
      commentaireSynthèse: {
        contenu: 'Le suivi de l’indicateur relatif à la protection Animale...',
        date: new Date(createdDate).toLocaleDateString('fr-FR'),
      },
    };

    await prisma.synthese_des_resultats.create({
      data: {
        chantier_id: 'CH-001',
        date_commentaire: '2022-08-05T00:00:00.000Z',
        maille: 'NAT',
        code_insee: 'FR',
      },
    });

    await prisma.synthese_des_resultats.create({
      data: {
        chantier_id: 'CH-001',
        date_commentaire: createdDate,
        commentaire: résultatAttendu.commentaireSynthèse.contenu,
        maille: 'NAT',
        code_insee: 'FR',
      },
    });

    const repository = new SynthèseDesRésultatsSQLRepository(prisma);
    const result = await repository.findNewestByChantierId('CH-001');
    expect(result).toStrictEqual(résultatAttendu);
  });
});
