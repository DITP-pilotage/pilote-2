import { mock } from "jest-mock-extended";
import { randomUUID } from "node:crypto";
import UtilisateurÀCréerOuMettreÀJourBuilder from "@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder";
import { fakeTerritoires } from "@/server/domain/territoire/Territoire.builder";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import {
  Habilitations,
  HabilitationsÀCréerOuMettreÀJourCalculées,
} from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { HistorisationModificationRepository } from "@/server/domain/historisationModification/HistorisationModificationRepository";
import { Profil } from "@/server/domain/profil/Profil.interface";
import { ProfilBuilder } from "@/server/domain/profil/Profil.builder";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import CréerOuMettreÀJourUnUtilisateurUseCase from "@/server/gestion-utilisateur/usecases/CréerOuMettreÀJourUnUtilisateurUseCase";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import { InformationChantierUtilisateur } from "@/server/gestion-utilisateur/domain/InformationChantierUtilisateur";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";

describe("CréerOuMettreÀJourUnUtilisateurUseCase", () => {
  const fakeChantiers: InformationChantierUtilisateur[] = [
    {
      id: "123",
      nom: "Salut",
      estTerritorialise: true,
      perimetreIds: ["PER-12"],
      ate: "hors_ate_deconcentre",
      statut: "PUBLIE",
      territoiresApplicables: [],
    },
    {
      id: "124",
      nom: "hoo",
      estTerritorialise: false,
      perimetreIds: ["PER-13"],
      ate: null,
      statut: "PUBLIE",
      territoiresApplicables: [],
    },
  ];

  const fakePérimètres = [
    { id: "PER-12" },
    { id: "PER-13" },
    { id: "PER-018" },
  ] as PérimètreMinistériel[];

  const habilitations = {
    gestionUtilisateur: {
      chantiers: fakeChantiers.map((c) => c.id),
      territoires: fakeTerritoires.map((t) => t.code),
    },
  } as Habilitations;

  const habilitationsVides = {
    lecture: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    saisieCommentaire: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    saisieIndicateur: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    gestionUtilisateur: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    responsabilite: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
  };

  const stubUtilisateurRepository = mock<UtilisateurRepository>();
  const stubUtilisateurIAMRepository = mock<UtilisateurIAMRepository>();
  const stubTerritoireRepository = mock<TerritoireRepository>();
  const stubChantierRepository = mock<ChantierRepository>();
  const stubPérimètreMinistérielRepository =
    mock<PerimetreMinisterielRepository>();
  const stubHistorisationModificationRepository =
    mock<HistorisationModificationRepository>();
  const stubContactInfolettreService = mock<ContactInfoLettresService>();

  stubTerritoireRepository.lister.mockResolvedValue(
    fakeTerritoires as Territoire[],
  );
  stubTerritoireRepository.listerCodes.mockResolvedValue(
    fakeTerritoires.map((territoire) => territoire.code),
  );

  stubChantierRepository.listerInformationsChantiersUtilisateurs.mockResolvedValue(
    fakeChantiers,
  );

  stubPérimètreMinistérielRepository.lister.mockResolvedValue(fakePérimètres);
  stubPérimètreMinistérielRepository.listerIds.mockResolvedValue(
    fakePérimètres.map((perimetre) => perimetre.id),
  );

  const créerOuMettreÀJourUnUtilisateurUseCase =
    new CréerOuMettreÀJourUnUtilisateurUseCase({
      utilisateurIAMRepository: stubUtilisateurIAMRepository,
      utilisateurRepository: stubUtilisateurRepository,
      territoireRepository: stubTerritoireRepository,
      chantierRepository: stubChantierRepository,
      perimetreMinisterielRepository: stubPérimètreMinistérielRepository,
      historisationModification: stubHistorisationModificationRepository,
      contactInfoLettresService: stubContactInfolettreService,
    });

  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
    process.env.IMPORT_KEYCLOAK_URL = "https://keycloak.net";
    (stubUtilisateurRepository.créerOuMettreÀJour as jest.Mock).mockClear();
    (stubUtilisateurIAMRepository.ajouteUtilisateurs as jest.Mock).mockClear();
    (
      stubChantierRepository.récupérerChantiersSynthétisés as jest.Mock
    ).mockClear();
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  async function testCasPassant(
    profilCode: ProfilCode,
    habilitationsAttendues: HabilitationsÀCréerOuMettreÀJourCalculées,
    saisieIndicateur: boolean,
    gestionUtilisateur: boolean,
    territoiresCodes?: string[],
    chantiersIds?: string[],
    périmètresIds?: string[],
    chantiersIdsResponsabilite?: string[],
    chantiersIdsSaisieCommentaire?: string[],
    profilGestionUtilisateur?: Profil["utilisateurs"],
  ) {
    //GIVEN
    const auteurId = randomUUID();
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
      .avecSaisieIndicateur(saisieIndicateur)
      .avecGestionUtilisateur(gestionUtilisateur)
      .avecProfil(profilCode)
      .avecHabilitationsLecture(territoiresCodes, chantiersIds, périmètresIds)
      .avecResponsabiliteChantiers(chantiersIdsResponsabilite)
      .avecResponsabiliteSaisieCommentaire(chantiersIdsSaisieCommentaire)
      .build();
    let profilBuilder = new ProfilBuilder().withCode(profilCode);
    if (profilGestionUtilisateur) {
      profilBuilder.withUtilisateurs(profilGestionUtilisateur);
    }
    const profil = profilBuilder.build();

    //WHEN
    await créerOuMettreÀJourUnUtilisateurUseCase.run(
      utilisateur,
      auteurId,
      false,
      habilitations,
      profil,
    );

    //THEN
    expect(
      stubUtilisateurRepository.créerOuMettreÀJour,
    ).toHaveBeenNthCalledWith(
      1,
      { ...utilisateur, habilitations: habilitationsAttendues },
      auteurId,
    );
    expect(
      stubUtilisateurIAMRepository.ajouteUtilisateurs,
    ).toHaveBeenNthCalledWith(1, [
      {
        nom: utilisateur.nom,
        prénom: utilisateur.prénom,
        email: utilisateur.email,
      },
    ]);
  }

  describe("Si la variable d'env IMPORT_KEYCLOAK_URL n'est pas définie", () => {
    it("ne créé pas l'utilisateur sur Keycloak", async () => {
      // Given
      process.env.IMPORT_KEYCLOAK_URL = undefined;
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
        .avecProfil(ProfilEnum.DITP_ADMIN)
        .build();
      const profil = new ProfilBuilder().build();

      //WHEN
      await créerOuMettreÀJourUnUtilisateurUseCase.run(
        utilisateur,
        randomUUID(),
        false,
        habilitations,
        profil,
      );

      //THEN
      expect(
        stubUtilisateurIAMRepository.ajouteUtilisateurs,
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe("L'utilisateur a un profil DITP_ADMIN", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(
        ProfilEnum.DITP_ADMIN,
        habilitationsVides,
        true,
        false,
      );
    });
  });

  describe("L'utilisateur a un profil PR", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(ProfilEnum.PR, habilitationsVides, true, false);
    });
  });

  describe("L'utilisateur a un profil PM_ET_CABINET", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(
        ProfilEnum.PM_ET_CABINET,
        habilitationsVides,
        true,
        false,
      );
    });
  });

  describe("L'utilisateur a un profil CABINET_MTFP", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(
        ProfilEnum.CABINET_MTFP,
        habilitationsVides,
        true,
        false,
      );
    });
  });

  describe("L'utilisateur a un profil CABINET_MINISTERIEL", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture sans accorder de droits de saisie", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: ["123"], territoires: [], périmètres: [] },
      };
      await testCasPassant(
        ProfilEnum.CABINET_MINISTERIEL,
        habilitationsAttendues,
        false,
        false,
        undefined,
        ["123"],
        [],
      );
    });
  });

  describe("L'utilisateur a un profil DIR_ADMIN_CENTRALE", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture sans accorder des droits de saisie", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: ["123"], territoires: [], périmètres: [] },
      };
      await testCasPassant(
        ProfilEnum.DIR_ADMIN_CENTRALE,
        habilitationsAttendues,
        false,
        false,
        undefined,
        ["123"],
        [],
      );
    });
  });

  describe("L'utilisateur a un profil SECRETARIAT_GENERAL", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: ["123"], territoires: [], périmètres: [] },
        saisieCommentaire: {
          territoires: [],
          chantiers: ["123"],
          périmètres: [],
        },
        saisieIndicateur: {
          territoires: [],
          chantiers: ["123"],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.SECRETARIAT_GENERAL,
        habilitationsAttendues,
        true,
        false,
        undefined,
        ["123"],
        [],
        [],
        ["123"],
      );
    });
  });

  describe("L'utilisateur a un profil EQUIPE_DIR_PROJET", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: ["123"], territoires: [], périmètres: [] },
        saisieCommentaire: {
          territoires: [],
          chantiers: ["123"],
          périmètres: [],
        },
        saisieIndicateur: {
          territoires: [],
          chantiers: ["123"],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.EQUIPE_DIR_PROJET,
        habilitationsAttendues,
        true,
        false,
        undefined,
        ["123"],
        [],
        [],
        ["123"],
      );
    });
  });

  describe("L'utilisateur a un profil DIR_PROJET", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: ["123"], territoires: [], périmètres: [] },
        saisieCommentaire: {
          territoires: [],
          chantiers: ["123"],
          périmètres: [],
        },
        saisieIndicateur: {
          territoires: [],
          chantiers: ["123"],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.DIR_PROJET,
        habilitationsAttendues,
        true,
        false,
        undefined,
        ["123"],
        [],
        [],
        ["123"],
      );
    });

    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en n'accordant pas les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: ["123"], territoires: [], périmètres: [] },
        saisieCommentaire: { territoires: [], chantiers: [], périmètres: [] },
        saisieIndicateur: { territoires: [], chantiers: [], périmètres: [] },
      };
      await testCasPassant(
        ProfilEnum.DIR_PROJET,
        habilitationsAttendues,
        false,
        false,
        undefined,
        ["123"],
        [],
        [],
        [],
      );
    });
  });

  describe("L'utilisateur a un profil ProfilEnum.COORDINATEUR_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture", async () => {
      const codeRégionParente = "REG-11";
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires
        .filter((t) => t.codeParent === codeRégionParente)
        .map((t) => t.code);

      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: {
          chantiers: [],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: [],
        },
        saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
      };
      await testCasPassant(
        ProfilEnum.COORDINATEUR_REGION,
        habilitationsAttendues,
        false,
        false,
        [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion],
      );
    });

    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture et en accordant les droits de gestion des utilisateurs", async () => {
      const codeRégionParente = "REG-11";
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires
        .filter((t) => t.codeParent === codeRégionParente)
        .map((t) => t.code);

      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: {
          chantiers: [],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: [],
        },
        gestionUtilisateur: {
          chantiers: [],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.COORDINATEUR_REGION,
        habilitationsAttendues,
        false,
        true,
        [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion],
      );
    });
  });

  describe("L'utilisateur a un profil PREFET_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture et en accordant les droits de saisie indicateurs", async () => {
      const codeRégionParente = "REG-11";
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires
        .filter((t) => t.codeParent === codeRégionParente)
        .map((t) => t.code);

      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: {
          chantiers: [],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.PREFET_REGION,
        habilitationsAttendues,
        false,
        false,
        [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion],
      );
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des régions et leurs départements enfants en lecture et une liste de chantiers territorialisés et une liste de périmètres", async () => {
      const codeRégionParente = "REG-11";
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires
        .filter((t) => t.codeParent === codeRégionParente)
        .map((t) => t.code);

      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: {
          chantiers: ["123"],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: ["PER-13"],
        },
      };
      await testCasPassant(
        ProfilEnum.SERVICES_DECONCENTRES_REGION,
        habilitationsAttendues,
        false,
        false,
        [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion],
        ["123"],
        ["PER-13"],
      );
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION et a des responsabilités sur des chantiers", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des régions et leurs départements enfants en lecture et une liste de chantiers territorialisés et une liste de périmètres et en accordant les droits de saisie commentaires et des responsabilités sur des chantiers", async () => {
      const codeRégionParente = "REG-11";
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires
        .filter((t) => t.codeParent === codeRégionParente)
        .map((t) => t.code);

      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: {
          chantiers: ["123"],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: ["PER-13"],
        },
        saisieCommentaire: {
          chantiers: ["123"],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: [],
        },
        responsabilite: {
          chantiers: ["123"],
          territoires: [
            codeRégionParente,
            ...codesDépartementsEnfantsDeLaRégion,
          ],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.SERVICES_DECONCENTRES_REGION,
        habilitationsAttendues,
        false,
        false,
        [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion],
        ["123"],
        ["PER-13"],
        ["123"],
        ["123"],
      );
    });
  });

  describe("L'utilisateur a un profil COORDINATEUR_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: [], territoires: ["DEPT-75"], périmètres: [] },
      };
      await testCasPassant(
        ProfilEnum.COORDINATEUR_DEPARTEMENT,
        habilitationsAttendues,
        false,
        false,
        ["DEPT-75"],
      );
    });
  });

  describe("L'utilisateur a un profil PREFET_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: { chantiers: [], territoires: ["DEPT-75"], périmètres: [] },
      };
      await testCasPassant(
        ProfilEnum.PREFET_DEPARTEMENT,
        habilitationsAttendues,
        false,
        false,
        ["DEPT-75"],
      );
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des départements, une liste de chantiers et une liste de périmètres en lecture", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: {
          chantiers: ["123"],
          territoires: ["DEPT-75"],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
        habilitationsAttendues,
        false,
        false,
        ["DEPT-75"],
        ["123"],
        [],
      );
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT et a des responsabilités sur des chantiers", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des départements, une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie commentaires et une responsabilite sur un chantier", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides,
        lecture: {
          chantiers: ["123"],
          territoires: ["DEPT-75"],
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: ["123"],
          territoires: ["DEPT-75"],
          périmètres: [],
        },
        responsabilite: {
          chantiers: ["123"],
          territoires: ["DEPT-75"],
          périmètres: [],
        },
      };
      await testCasPassant(
        ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
        habilitationsAttendues,
        false,
        false,
        ["DEPT-75"],
        ["123"],
        [],
        ["123"],
        ["123"],
      );
    });
  });
});
