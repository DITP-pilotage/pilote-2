import { randomUUID } from "node:crypto";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";
import { ImporterDonneesChantierCSVUseCase } from "@/server/infrastructure/import_csv/donnees_chantier/ImporterDonneesChantierCSVUseCase";

async function créerUtilisateurEnBase(email?: string) {
  const auteurId = randomUUID();
  await prisma.utilisateur.create({
    data: {
      id: auteurId,
      email: email ?? `test-${auteurId}@test.com`,
      nom: "Doe",
      prenom: "John",
      date_creation: new Date().toISOString(),
      profil: {
        connect: {
          code: ProfilEnum.EQUIPE_DIR_PROJET,
        },
      },
    },
  });
  return auteurId;
}

async function créerUtilisateurImportEnBase() {
  const utilisateurExistant = await prisma.utilisateur.findFirst({
    where: { email: "import.csv@modernisation.gouv.fr" },
  });
  if (utilisateurExistant) return utilisateurExistant.id;

  return créerUtilisateurEnBase("import.csv@modernisation.gouv.fr");
}

async function créerDonnéesDeRéférence(chantierId: string) {
  await prisma.chantier_identite.create({
    data: {
      id: chantierId,
      nom: "Test Chantier",
      est_territorialise: true,
      directeurs_administration_centrale: [],
      directeurs_projet_ids: [],
    },
  });

  await prisma.territoire.upsert({
    where: { code: "NAT-FR" },
    update: {},
    create: {
      code: "NAT-FR",
      nom: "National",
      nom_affiche: "National",
      maille: "NAT",
      code_insee: "FR",
      zone_id: "FR",
    },
  });

  await prisma.chantier_territoire.create({
    data: {
      id: chantierId,
      territoire_code: "NAT-FR",
      code_insee: "FR",
      zone_id: "FR",
      maille: "NAT",
    },
  });
}

function créerUseCase() {
  return new ImporterDonneesChantierCSVUseCase({
    prisma,
    importerCommentairesUseCase: getContainer("commentaires").resolve(
      "importerCommentairesUseCase",
    ),
    importerSynthesesDesResultatsUseCase: getContainer(
      "importSyntheseDesResultats",
    ).resolve("importerSynthesesDesResultatsUseCase"),
    importerDecisionsStrategiquesUseCase: getContainer(
      "decisionStrategique",
    ).resolve("importerDecisionsStrategiquesUseCase"),
    importerObjectifsUseCase: getContainer("objectif").resolve(
      "importerObjectifsUseCase",
    ),
  });
}

describe("ImporterDonneesChantierCSVUseCase", () => {
  it("répartit les lignes d'un CSV vers les 4 domaines cibles", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    await créerUtilisateurImportEnBase();
    await créerDonnéesDeRéférence(chantierId);

    const lignesBrutes = [
      {
        chantier_id: chantierId,
        type: "freins_a_lever",
        contenu: "Un frein identifié",
        date: "2026-01-15",
        auteur_email: "",
        maille: "",
        code_insee: "",
        meteo: "",
      },
      {
        chantier_id: chantierId,
        type: "synthese_des_resultats",
        contenu: "Trajectoire conforme",
        date: "2026-01-15",
        auteur_email: "",
        maille: "",
        code_insee: "",
        meteo: "SOLEIL",
      },
      {
        chantier_id: chantierId,
        type: "suivi_des_decisions",
        contenu: "Décision actée",
        date: "2026-01-15",
        auteur_email: "",
        maille: "",
        code_insee: "",
        meteo: "",
      },
      {
        chantier_id: chantierId,
        type: "notre_ambition",
        contenu: "Réduire le délai",
        date: "2026-01-15",
        auteur_email: "",
        maille: "",
        code_insee: "",
        meteo: "",
      },
    ];

    // When
    const résultat = await créerUseCase().execute(lignesBrutes);

    // Then
    expect(résultat).toEqual({
      succès: true,
      comptesParDomaine: {
        commentaire: 1,
        synthese_des_resultats: 1,
        decision_strategique: 1,
        objectif: 1,
      },
    });

    const commentaires = await prisma.commentaire.findMany({
      where: { chantier_id: chantierId },
    });
    expect(commentaires).toHaveLength(1);
    expect(commentaires[0].type).toEqual("freins_a_lever");

    const syntheses = await prisma.synthese_des_resultats.findMany({
      where: { chantier_id: chantierId },
    });
    expect(syntheses).toHaveLength(1);
    expect(syntheses[0].meteo).toEqual("SOLEIL");

    const decisions = await prisma.decision_strategique.findMany({
      where: { chantier_id: chantierId },
    });
    expect(decisions).toHaveLength(1);

    const objectifs = await prisma.objectif.findMany({
      where: { chantier_id: chantierId },
    });
    expect(objectifs).toHaveLength(1);
  });

  it("attribue le commentaire à l'auteur correspondant à auteur_email", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    await créerUtilisateurImportEnBase();
    await créerDonnéesDeRéférence(chantierId);
    const email = `auteur-${randomUUID().slice(0, 6)}@test.com`;
    const auteurId = await créerUtilisateurEnBase(email);

    // When
    await créerUseCase().execute([
      {
        chantier_id: chantierId,
        type: "commentaires_sur_les_donnees",
        contenu: "Commentaire attribué",
        date: "2026-01-15",
        auteur_email: email,
        maille: "",
        code_insee: "",
        meteo: "",
      },
    ]);

    // Then
    const commentaires = await prisma.commentaire.findMany({
      where: { chantier_id: chantierId },
    });
    expect(commentaires[0].auteur_creation_id).toEqual(auteurId);
  });

  it("attribue à l'utilisateur système quand auteur_email est vide ou inconnu", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const utilisateurImportId = await créerUtilisateurImportEnBase();
    await créerDonnéesDeRéférence(chantierId);

    // When
    await créerUseCase().execute([
      {
        chantier_id: chantierId,
        type: "commentaires_sur_les_donnees",
        contenu: "Commentaire sans auteur connu",
        date: "2026-01-15",
        auteur_email: "inconnu@test.com",
        maille: "",
        code_insee: "",
        meteo: "",
      },
    ]);

    // Then
    const commentaires = await prisma.commentaire.findMany({
      where: { chantier_id: chantierId },
    });
    expect(commentaires[0].auteur_creation_id).toEqual(utilisateurImportId);
  });

  it("n'importe rien si une ligne est invalide (tout ou rien)", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    await créerUtilisateurImportEnBase();
    await créerDonnéesDeRéférence(chantierId);

    // When
    const résultat = await créerUseCase().execute([
      {
        chantier_id: chantierId,
        type: "commentaires_sur_les_donnees",
        contenu: "Commentaire valide",
        date: "2026-01-15",
        auteur_email: "",
        maille: "",
        code_insee: "",
        meteo: "",
      },
      {
        chantier_id: chantierId,
        type: "type_inexistant",
        contenu: "Commentaire invalide",
        date: "2026-01-15",
        auteur_email: "",
        maille: "",
        code_insee: "",
        meteo: "",
      },
    ]);

    // Then
    expect(résultat.succès).toEqual(false);
    const commentaires = await prisma.commentaire.findMany({
      where: { chantier_id: chantierId },
    });
    expect(commentaires).toHaveLength(0);
  });
});
