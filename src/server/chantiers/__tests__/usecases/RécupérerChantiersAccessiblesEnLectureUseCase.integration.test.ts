describe('RécupérerChantiersAccessiblesEnLectureUseCase', () => {
/*
  let récupérerChantiersAccessiblesEnLectureUseCase: RécupérerChantiersAccessiblesEnLectureUseCase;
  let chantierRepository: ChantierRepository;
  let ministèreRepository: MinistèreRepository;
  let territoireRepository: TerritoireRepository;
  
  beforeEach(() => {
    chantierRepository = dependencies.getChantierRepository();
    ministèreRepository = dependencies.getMinistèreRepository();
    territoireRepository = dependencies.getTerritoireRepository();
    récupérerChantiersAccessiblesEnLectureUseCase = new RécupérerChantiersAccessiblesEnLectureUseCase( chantierRepository, ministèreRepository, territoireRepository);
  });

  test('un chantier sans ministères est exclu du résultat', async () => {
    // GIVEN

    const chantierId = 'CH-001';

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    await prisma.chantier.create({
      data: new ChantierSQLRowBuilder()
        .avecId(chantierId).avecMaille('NAT').avecTauxAvancement(18).avecMinistères([]).build(),
    });

    // WHEN
    const result = await récupérerChantiersAccessiblesEnLectureUseCase.run(habilitation, ProfilEnum.DITP_ADMIN);

    // THEN
    expect(result).toStrictEqual([]);
  });

  test('Accède à une liste de chantier', async () => {
    // GIVEN
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecMaille('NAT').build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-002').avecMaille('NAT').avecTauxAvancement(50).build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-002').avecMaille('DEPT').avecCodeInsee('13').avecTauxAvancement(50).build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const chantiers = await récupérerChantiersAccessiblesEnLectureUseCase.run(habilitation, ProfilEnum.DITP_ADMIN);

    // THEN
    const ids = chantiers.map(ch => ch.id);
    expect(ids).toStrictEqual(['CH-001', 'CH-002']);
    expect(chantiers[1].mailles.nationale['NAT-FR'].avancement.global).toBe(50);
  });

  test('Un code insee sur trois caractères fonctionne', async () => {
    // GIVEN
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecMaille('NAT').build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecMaille('DEPT').avecCodeInsee('974').build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const chantiers = await récupérerChantiersAccessiblesEnLectureUseCase.run(habilitation, ProfilEnum.DITP_ADMIN);

    // THEN
    expect(chantiers[0].mailles.departementale['DEPT-974']).toBeDefined();
  });

 */
});
