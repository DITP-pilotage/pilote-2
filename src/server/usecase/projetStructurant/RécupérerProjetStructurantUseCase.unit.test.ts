import SynthèseDesRésultatsBuilder from '@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.builder';
import ProjetStructurantRepository from '@/server/domain/projetStructurant/ProjetStructurantRepository.interface';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';
import TerritoireBuilder from '@/server/domain/territoire/Territoire.builder';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import ProjetStructurantRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ProjetStructurantSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProjetStructurantNonAutoriséErreur } from '@/server/utils/errors';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import RécupérerProjetStructurantUseCase from './RécupérerProjetStructurantUseCase';

describe('Récupérer projet structurant', () => {
  let projetStructurantRepository: ProjetStructurantRepository;
  let territoireRepository: TerritoireRepository;
  let ministèreRepository: MinistèreRepository;
  let synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository;
  let récupérerProjetStructurantUseCase: RécupérerProjetStructurantUseCase;
  
  beforeEach(() => {
    projetStructurantRepository = {
      récupérer: jest.fn(),
    } as unknown as ProjetStructurantRepository;
    
    territoireRepository = {
      récupérer: jest.fn(),
    } as unknown as TerritoireRepository;

    ministèreRepository = {
      récupérerLesNomsAssociésÀLeurPérimètre: jest.fn(),
    } as unknown as MinistèreRepository;
  
    synthèseDesRésultatsRepository = {
      récupérerLaPlusRécente: jest.fn(),
    } as unknown as SynthèseDesRésultatsProjetStructurantRepository;
  
    récupérerProjetStructurantUseCase = new RécupérerProjetStructurantUseCase(
      projetStructurantRepository,
      territoireRepository,
      ministèreRepository,
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

    const habilitation = {
      'projetsStructurants.lecture': {
        projetsStructurants: [projetStructurantPrisma.id],
      } } as unknown as Utilisateur['habilitations'];
      
    const projetStructurantPrismaVersLeDomaine = {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      territoireCode: projetStructurantPrisma.territoire_code,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      avancement: projetStructurantPrisma.taux_avancement,
      dateAvancement: projetStructurantPrisma.date_taux_avancement ? projetStructurantPrisma.date_taux_avancement.toISOString() : null,
      directionAdmininstration: projetStructurantPrisma.direction_administration,
      chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
      coporteurs: projetStructurantPrisma.co_porteurs,
    };
    
    beforeEach(() => {
      (projetStructurantRepository.récupérer as jest.Mock).mockResolvedValue(projetStructurantPrismaVersLeDomaine);
      (territoireRepository.récupérer as jest.Mock).mockResolvedValue(territoire);
      (ministèreRepository.récupérerLesNomsAssociésÀLeurPérimètre as jest.Mock).mockResolvedValue([
        { perimetre_id: périmètre1.id, nom: périmètre1.ministèreNom },
        { perimetre_id: périmètre2.id, nom: périmètre2.ministèreNom },
        { perimetre_id: périmètre3.id, nom: périmètre3.ministèreNom },
      ]);
      (synthèseDesRésultatsRepository.récupérerLaPlusRécente as jest.Mock).mockResolvedValue(synthèseDesRésultats);
    });
  
    it('Accède à un projet structurant par son id', async () => {
    //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id, habilitation);

      //THEN
      expect(résultat.id).toEqual(projetStructurantPrisma.id);
    });

    it('Récupère le terrioire associé avec sa maille, son code insee et son nom à afficher', async () => {
    //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id, habilitation);

      //THEN
      expect(résultat.territoire.code).toEqual(projetStructurantPrisma.territoire_code);
      expect(résultat.territoire.code).toEqual(territoire.code);
      expect(résultat.territoire.maille).toEqual(territoire.maille);
      expect(résultat.territoire.codeInsee).toEqual(territoire.codeInsee);
      expect(résultat.territoire.nomAffiché).toEqual(territoire.nomAffiché);
    });

    it('Récupère les noms des minisères associés', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id, habilitation);

      //THEN
      expect(résultat.responsables.ministèrePorteur).toEqual(périmètre1.ministèreNom);
      expect(résultat.responsables.ministèresCoporteurs).toEqual([périmètre2.ministèreNom, périmètre3.ministèreNom]);
    });

    it('Récupère la météo associée', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id, habilitation);

      //THEN
      expect(résultat.météo).toEqual(synthèseDesRésultats!.météo);
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

    const projetStructurantPrismaVersLeDomaine = {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      territoireCode: projetStructurantPrisma.territoire_code,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      avancement: projetStructurantPrisma.taux_avancement,
      dateAvancement: projetStructurantPrisma.date_taux_avancement ? projetStructurantPrisma.date_taux_avancement.toISOString() : null,
      directionAdmininstration: projetStructurantPrisma.direction_administration,
      chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
      coporteurs: projetStructurantPrisma.co_porteurs,
    };

    const habilitation = {
      'projetsStructurants.lecture': {
        projetsStructurants: [projetStructurantPrisma.id],
      } } as unknown as Utilisateur['habilitations'];
        
    beforeEach(() => {
      (projetStructurantRepository.récupérer as jest.Mock).mockResolvedValue(projetStructurantPrismaVersLeDomaine);
      (territoireRepository.récupérer as jest.Mock).mockResolvedValue(territoire);
      (ministèreRepository.récupérerLesNomsAssociésÀLeurPérimètre as jest.Mock).mockResolvedValue([
        { perimetre_id: périmètre.id, nom: périmètre.ministèreNom },
      ]);      (synthèseDesRésultatsRepository.récupérerLaPlusRécente as jest.Mock).mockResolvedValue(synthèseDesRésultats);
    });

    it('Retourne le nom du ministère poteur et une liste vide de ministères coporteurs', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id, habilitation);

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

    const projetStructurantPrismaVersLeDomaine = {
      id: projetStructurantPrisma.id,
      nom: projetStructurantPrisma.nom,
      territoireCode: projetStructurantPrisma.territoire_code,
      périmètresIds: projetStructurantPrisma.perimetres_ids,
      avancement: projetStructurantPrisma.taux_avancement,
      dateAvancement: projetStructurantPrisma.date_taux_avancement ? projetStructurantPrisma.date_taux_avancement.toISOString() : null,
      directionAdmininstration: projetStructurantPrisma.direction_administration,
      chefferieDeProjet: projetStructurantPrisma.chefferie_de_projet,
      coporteurs: projetStructurantPrisma.co_porteurs,
    };

    const habilitation = {
      'projetsStructurants.lecture': {
        projetsStructurants: [projetStructurantPrisma.id],
      } } as unknown as Utilisateur['habilitations'];
        
    beforeEach(() => {
      (projetStructurantRepository.récupérer as jest.Mock).mockResolvedValue(projetStructurantPrismaVersLeDomaine);
      (territoireRepository.récupérer as jest.Mock).mockResolvedValue(territoire);
      (ministèreRepository.récupérerLesNomsAssociésÀLeurPérimètre as jest.Mock).mockResolvedValue([
        { perimetre_id: périmètre.id, nom: périmètre.ministèreNom },
      ]);    
    });

    it('Retourne une météo non renseignée', async () => {
      //WHEN
      const résultat = await récupérerProjetStructurantUseCase.run(projetStructurantPrisma.id, habilitation);

      //THEN
      expect(résultat.météo).toEqual('NON_RENSEIGNEE');
    });
  });

  describe("Essayer d'accéder à un projet structurant non autorisé", () => {
    it('renvoi une erreur ProjetStructurantNonAutoriséErreur', async () => {
      //WHEN
      const habilitation = {
        'projetsStructurants.lecture': {
          projetsStructurants: [],
        } } as unknown as Utilisateur['habilitations'];

      //THEN
      await expect(récupérerProjetStructurantUseCase.run('PS-123', habilitation)).rejects.toThrowError(ProjetStructurantNonAutoriséErreur);
    });
  });
});

