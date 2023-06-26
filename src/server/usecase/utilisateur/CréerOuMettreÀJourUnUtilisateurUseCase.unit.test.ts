import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { fakeTerritoires } from '@/server/domain/territoire/Territoire.builder';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import CréerOuMettreÀJourUnUtilisateurUseCase from './CréerOuMettreÀJourUnUtilisateurUseCase';

describe('CréerOuMettreÀJourUnUtilisateurUseCase', () => {
  const stubUtilisateurRepository = { créerOuMettreÀJour: jest.fn() } as unknown as UtilisateurRepository;
  const stubUtilisateurIAMRepository = { ajouteUtilisateurs: jest.fn() } as unknown as UtilisateurIAMRepository;
  const stubTerritoireRepository = { récupérerTous: jest.fn().mockResolvedValue(fakeTerritoires) } as unknown as TerritoireRepository;
  const créerOuMettreÀJourUnUtilisateurUseCase = new CréerOuMettreÀJourUnUtilisateurUseCase(stubUtilisateurRepository, stubUtilisateurIAMRepository, stubTerritoireRepository);
  const tousLesTerritoiresCodes = fakeTerritoires.map(territoire => territoire.code);

  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
    process.env.DEV_PASSWORD = undefined;
    (stubUtilisateurRepository.créerOuMettreÀJour as jest.Mock).mockClear();
    (stubUtilisateurIAMRepository.ajouteUtilisateurs as jest.Mock).mockClear();
  });
  
  afterEach(() => {
    process.env = oldEnv;
  });

  async function testAccèsTerritoiresEnLectureCasPassant(profilCode: ProfilCode, territoiresCodes: string[]) {
    //GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil(profilCode).avecHabilitationLecture(undefined, territoiresCodes).build();

    //WHEN
    await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto');

    //THEN
    expect(stubUtilisateurRepository.créerOuMettreÀJour).toHaveBeenCalledTimes(1);
    expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenCalledTimes(1);
  }

  async function testAccèsTerritoiresEnLectureCasErreur(profilCode: ProfilCode, territoiresCodes: string[]) {
    // GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil(profilCode).avecHabilitationLecture(undefined, territoiresCodes).build();

    // THEN
    await expect(créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto')).rejects.toThrowError();
  }

  

  describe("Si la variable d'env DEV_PASSWORD est définie", () => {
    it("ne créé par l'utilisateur sur Keycloak", async () => {
      // GIVEN 
      process.env.DEV_PASSWORD = 'password';
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil('PREFET_REGION').build();

      //WHEN
      await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto');
        
      //THEN
      expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenCalledTimes(0);
    });
  });
  
  describe("L'utilisateur a un profil DITP_ADMIN", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DITP_ADMIN', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DITP_ADMIN', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil DITP_PILOTAGE", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DITP_PILOTAGE', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DITP_PILOTAGE', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil PR", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('PR', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PR', []);
      }); 
    });
  });


  describe("L'utilisateur a un profil PM_ET_CABINET", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('PM_ET_CABINET', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PM_ET_CABINET', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil CABINET_MTFP", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('CABINET_MTFP', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('CABINET_MTFP', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil CABINET_MINISTERIEL", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('CABINET_MINISTERIEL', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('CABINET_MINISTERIEL', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil DIR_ADMIN_CENTRALE", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DIR_ADMIN_CENTRALE', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DIR_ADMIN_CENTRALE', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil SECRETARIAT_GENERAL", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('SECRETARIAT_GENERAL', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SECRETARIAT_GENERAL', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil EQUIPE_DIR_PROJET", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('EQUIPE_DIR_PROJET', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('EQUIPE_DIR_PROJET', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil DIR_PROJET", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DIR_PROJET', tousLesTerritoiresCodes);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DIR_PROJET', []);
      }); 
    });
  });

  describe("L'utilisateur a un profil REFERENT_REGION", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à 0 ou plusieurs régions ainsi que leurs départements enfants", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        const codeRégionParente = 'REG-11';
        const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
        await testAccèsTerritoiresEnLectureCasPassant('REFERENT_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est ni un département ni une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_REGION', ['NAT-FR']);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les départements enfants d'une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_REGION', ['REG-11']);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas la région parente d'un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_REGION', ['DEPT-75']);
      }); 
    });
  });

  describe("L'utilisateur a un profil PREFET_REGION", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à 0 ou plusieurs régions ainsi que leurs départements enfants", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        const codeRégionParente = 'REG-11';
        const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
        await testAccèsTerritoiresEnLectureCasPassant('PREFET_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est ni un département ni une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_REGION', ['NAT-FR']);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les départements enfants d'une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_REGION', ['REG-11']);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas la région parente d'un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_REGION', ['DEPT-75']);
      }); 
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à 0 ou plusieurs régions ainsi que leurs départements enfants", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        const codeRégionParente = 'REG-11';
        const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
        await testAccèsTerritoiresEnLectureCasPassant('SERVICES_DECONCENTRES_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est ni un département ni une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', ['NAT-FR']);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les départements enfants d'une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', ['REG-11']);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas la région parente d'un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', ['DEPT-75']);
      }); 
    });
  });

  describe("L'utilisateur a un profil REFERENT_DEPARTEMENT", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à 0 ou plusieurs départements", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('REFERENT_DEPARTEMENT', ['DEPT-75']);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_DEPARTEMENT', ['NAT-FR']);
      }); 
    });
  });

  describe("L'utilisateur a un profil PREFET_DEPARTEMENT", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à 0 ou plusieurs départements", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('PREFET_DEPARTEMENT', ['DEPT-75']);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_DEPARTEMENT', ['NAT-FR']);
      }); 
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à 0 ou plusieurs départements", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('SERVICES_DECONCENTRES_DEPARTEMENT', ['DEPT-75']);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_DEPARTEMENT', ['NAT-FR']);
      }); 
    });
  });

  describe("L'utilisateur a un profil DROM", () => {
    describe("L'utilisateur doit avoir accès, pour les chantiers, à tous les territoires DROM et le territoire France", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DROM', codesTerritoiresDROM);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un territoire DROM", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DROM', ['DEPT-75']);
      }); 
    });
  });
});
