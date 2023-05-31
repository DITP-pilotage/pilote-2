import SynthèseDesRésultatsBuilder from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.builder';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import TerritoireBuilder from '@/server/domain/territoire/Territoire.builder';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import ProjetStructurantRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ProjetStructurantSQLRow.builder';
import RécupérerProjetStructurantUseCase from './RécupérerProjetStructurantUseCase';

describe('Récupérer projet structurant', () => {
  let projetStructurantRepository: ProjetStructurantRepository;
  let territoireRepository: TerritoireRepository;
  let périmètreMinistérielRepository: PérimètreMinistérielRepository;
  let synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository;
  let récupérerProjetStructurantUseCase: RécupérerProjetStructurantUseCase;
  
  beforeEach(() => {
    projetStructurantRepository = {
      récupérer: jest.fn(),
    } as unknown as ProjetStructurantRepository;
    
    territoireRepository = {
      récupérer: jest.fn(),
    } as unknown as TerritoireRepository;

    périmètreMinistérielRepository = {
      récupérerListe: jest.fn(),
    } as unknown as PérimètreMinistérielRepository;
  
    synthèseDesRésultatsRepository = {
      récupérerLaPlusRécente: jest.fn(),
    } as unknown as SynthèseDesRésultatsProjetStructurantRepository;
  
    récupérerProjetStructurantUseCase = new RécupérerProjetStructurantUseCase(
      projetStructurantRepository,
      territoireRepository,
      périmètreMinistérielRepository,
      synthèseDesRésultatsRepository,
    );
  });

  describe('Cas simple', () => {
    //GIVEN
    const territoire = new TerritoireBuilder().build();
    const périmètre1 = new PérimètreMinistérielBuilder().build();
    const périmètre2 = new PérimètreMinistérielBuilder().build();
    const périmètre3 = new PérimètreMinistérielBuilder().build();
    const synthèseDesRésultats = new SynthèseDesRésultatsBuilder().nonNull().build();

    const projetStructurantPrisma = new ProjetStructurantRowBuilder()
      .avecPérimètresIds([périmètre1.id, périmètre2.id, périmètre3.id])
      .avecTerritoireCode(territoire.code)
      .build();
    
    beforeEach(() => {
      (projetStructurantRepository.récupérer as jest.Mock).mockResolvedValue(projetStructurantPrisma);
      (territoireRepository.récupérer as jest.Mock).mockResolvedValue(territoire);
      (périmètreMinistérielRepository.récupérerListe as jest.Mock).mockResolvedValue([périmètre1, périmètre2, périmètre3]);
      (synthèseDesRésultatsRepository.récupérerLaPlusRécente as jest.Mock).mockResolvedValue(synthèseDesRésultats);
    });
  
    it('Accède à un projet structurant par son id', async () => {
    //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id);

      //THEN
      expect(résultat.id).toEqual(projetStructurantPrisma.id);
    });

    it('Récupère le terrioire associé avec sa maille, son code insee et son nom à afficher', async () => {
    //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id);

      //THEN
      expect(résultat.codeTerritoire).toEqual(projetStructurantPrisma.territoire_code);
      expect(résultat.codeTerritoire).toEqual(territoire.code);
      expect(résultat.maille).toEqual(territoire.maille);
      expect(résultat.codeInsee).toEqual(territoire.codeInsee);
      expect(résultat.territoireNomÀAfficher).toEqual(territoire.nomAffiché);
    });

    it('Récupère les noms des minisères associés', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id);

      //THEN
      expect(résultat.responsables.ministèrePorteur).toEqual(périmètre1.ministèreNom);
      expect(résultat.responsables.ministèresCoporteurs).toEqual([périmètre2.ministèreNom, périmètre3.ministèreNom]);
    });

    it('Récupère la météo associée', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id);

      //THEN
      expect(résultat.météo).toEqual(synthèseDesRésultats!.météo);
    });
  });

  describe('Plusieurs périmètres appartiennent au même ministère', () => {
    //GIVEN
    const territoire = new TerritoireBuilder().build();
    const périmètre1 = new PérimètreMinistérielBuilder().avecMinistèreNom('Agriculture et alimentation').build();
    const périmètre2 = new PérimètreMinistérielBuilder().build();
    const périmètre3 = new PérimètreMinistérielBuilder().avecMinistèreNom('Agriculture et alimentation').build();
    const synthèseDesRésultats = new SynthèseDesRésultatsBuilder().nonNull().build();

    const projetStructurantPrisma = new ProjetStructurantRowBuilder()
      .avecPérimètresIds([périmètre1.id, périmètre2.id, périmètre3.id])
      .avecTerritoireCode(territoire.code)
      .build();
        
    beforeEach(() => {
      (projetStructurantRepository.récupérer as jest.Mock).mockResolvedValue(projetStructurantPrisma);
      (territoireRepository.récupérer as jest.Mock).mockResolvedValue(territoire);
      (périmètreMinistérielRepository.récupérerListe as jest.Mock).mockResolvedValue([périmètre1, périmètre2, périmètre3]);
      (synthèseDesRésultatsRepository.récupérerLaPlusRécente as jest.Mock).mockResolvedValue(synthèseDesRésultats);
    });

    it('Retourne la liste des minisètes associés sans doublon', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id);

      //THEN
      expect(résultat.responsables.ministèrePorteur).toEqual(périmètre1.ministèreNom);
      expect(résultat.responsables.ministèresCoporteurs).toEqual([périmètre2.ministèreNom]);

    });
  });

  describe("Il n'y a qu'un PM", () => {
    //GIVEN
    const territoire = new TerritoireBuilder().build();
    const périmètre = new PérimètreMinistérielBuilder().build();
    const synthèseDesRésultats = new SynthèseDesRésultatsBuilder().nonNull().build();

    const projetStructurantPrisma = new ProjetStructurantRowBuilder()
      .avecPérimètresIds([périmètre.id])
      .avecTerritoireCode(territoire.code)
      .build();
        
    beforeEach(() => {
      (projetStructurantRepository.récupérer as jest.Mock).mockResolvedValue(projetStructurantPrisma);
      (territoireRepository.récupérer as jest.Mock).mockResolvedValue(territoire);
      (périmètreMinistérielRepository.récupérerListe as jest.Mock).mockResolvedValue([périmètre]);
      (synthèseDesRésultatsRepository.récupérerLaPlusRécente as jest.Mock).mockResolvedValue(synthèseDesRésultats);
    });

    it('Retourne le nom du ministère poteur et une liste vide de ministères coporteurs', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id);

      //THEN
      expect(résultat.responsables.ministèrePorteur).toEqual(périmètre.ministèreNom);
      expect(résultat.responsables.ministèresCoporteurs).toEqual([]);
    });
  });

  describe("Il n'y a pas de synthèse des résultats", () => {
    //GIVEN
    const territoire = new TerritoireBuilder().build();
    const périmètre = new PérimètreMinistérielBuilder().build();

    const projetStructurantPrisma = new ProjetStructurantRowBuilder()
      .avecPérimètresIds([périmètre.id])
      .avecTerritoireCode(territoire.code)
      .build();
        
    beforeEach(() => {
      (projetStructurantRepository.récupérer as jest.Mock).mockResolvedValue(projetStructurantPrisma);
      (territoireRepository.récupérer as jest.Mock).mockResolvedValue(territoire);
      (périmètreMinistérielRepository.récupérerListe as jest.Mock).mockResolvedValue([périmètre]);
    });

    it('Retourne une météo non renseignée', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id);

      //THEN
      expect(résultat.météo).toEqual('NON_RENSEIGNEE');
    });
  });
});

