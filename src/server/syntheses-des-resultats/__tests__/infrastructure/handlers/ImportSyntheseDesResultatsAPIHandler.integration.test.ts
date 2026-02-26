import { createMocks } from "node-mocks-http";
import { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";
import { UtilisateurAuthentifie } from "@/server/authentification/domain/UtilisateurAuthentifie";

async function créerUtilisateurEnBase() {
  const auteurId = randomUUID();
  await prisma.utilisateur.create({
    data: {
      id: auteurId,
      email: `test-${auteurId}@test.com`,
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

async function créerDonnéesDeRéférence(chantierId: string) {
  await prisma.chantier_identite.create({
    data: {
      id: chantierId,
      nom: "Test Chantier",
      est_territorialise: true,
      directeurs_administration_centrale: [],
      directeurs_projet: [],
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

function créerUtilisateurAuthentifié(
  auteurId: string,
  chantierId: string,
  options?: { territoires?: string[] },
) {
  return UtilisateurAuthentifie.creerUtilisateurAuthentifie({
    id: auteurId,
    email: "test@test.com",
    profil: ProfilEnum.EQUIPE_DIR_PROJET,
    profilAAccèsAuxChantiersBrouillons: false,
    habilitations: {
      lecture: {
        chantiers: [chantierId],
        territoires: options?.territoires ?? ["NAT-FR"],
        périmètres: [],
      },
      saisieCommentaire: {
        chantiers: [chantierId],
        territoires: options?.territoires ?? ["NAT-FR"],
        périmètres: [],
      },
      saisieIndicateur: {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      responsabilite: {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      gestionUtilisateur: {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
    },
  });
}

function créerMockRequestAvecBody(body: unknown) {
  const { req: request, res: response } = createMocks<
    NextApiRequest,
    NextApiResponse
  >({
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
  });

  const bodyStr = JSON.stringify(body);
  process.nextTick(() => {
    request.emit("data", Buffer.from(bodyStr));
    request.emit("end");
  });

  return { request, response };
}

function créerMockRequestAvecBodyInvalide() {
  const { req: request, res: response } = createMocks<
    NextApiRequest,
    NextApiResponse
  >({
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
  });

  process.nextTick(() => {
    request.emit("data", Buffer.from("invalid json{{{"));
    request.emit("end");
  });

  return { request, response };
}

describe("ImportSyntheseDesResultatsAPIHandler", () => {
  it("importe une synthèse des résultats valide et la persiste en base", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();
    await créerDonnéesDeRéférence(chantierId);
    const utilisateurAuthentifié = créerUtilisateurAuthentifié(
      auteurId,
      chantierId,
    );

    const body = {
      syntheses_des_resultats: [
        {
          territoire: "NAT-FR",
          contenu: "Contenu de la synthèse de test",
          meteo: "SOLEIL",
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importSyntheseDesResultats")
      .resolve("importSyntheseDesResultatsAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(200);
    expect(response._getJSONData().message).toEqual(
      "Les synthèses des résultats ont correctement été importées",
    );

    const synthesesEnBase = await prisma.synthese_des_resultats.findMany({
      where: { chantier_id: chantierId },
    });
    expect(synthesesEnBase).toHaveLength(1);
    expect(synthesesEnBase[0].commentaire).toEqual(
      "Contenu de la synthèse de test",
    );
    expect(synthesesEnBase[0].meteo).toEqual("SOLEIL");
    expect(synthesesEnBase[0].auteur_id).toEqual(auteurId);
  });

  it("retourne 400 quand le JSON est invalide", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();
    const utilisateurAuthentifié = créerUtilisateurAuthentifié(
      auteurId,
      chantierId,
    );

    const { request, response } = créerMockRequestAvecBodyInvalide();

    // When
    await getContainer("importSyntheseDesResultats")
      .resolve("importSyntheseDesResultatsAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(400);
    expect(response._getJSONData().message).toEqual(
      "Le corps de la requête n'est pas un JSON valide",
    );
  });

  it("retourne 403 quand le chantier n'est pas autorisé", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();

    const utilisateurAuthentifié =
      UtilisateurAuthentifie.creerUtilisateurAuthentifie({
        id: auteurId,
        email: "test@test.com",
        profil: ProfilEnum.EQUIPE_DIR_PROJET,
        profilAAccèsAuxChantiersBrouillons: false,
        habilitations: {
          lecture: { chantiers: [], territoires: [], périmètres: [] },
          saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
          saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
          responsabilite: { chantiers: [], territoires: [], périmètres: [] },
          gestionUtilisateur: {
            chantiers: [],
            territoires: [],
            périmètres: [],
          },
        },
      });

    const body = {
      syntheses_des_resultats: [
        {
          territoire: "NAT-FR",
          contenu: "Tentative non autorisée",
          meteo: "SOLEIL",
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importSyntheseDesResultats")
      .resolve("importSyntheseDesResultatsAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(403);
  });

  it("retourne 400 quand la météo est invalide (validation Zod)", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();
    await créerDonnéesDeRéférence(chantierId);
    const utilisateurAuthentifié = créerUtilisateurAuthentifié(
      auteurId,
      chantierId,
    );

    const body = {
      syntheses_des_resultats: [
        {
          territoire: "NAT-FR",
          contenu: "Synthèse avec météo invalide",
          meteo: "METEO_INVALIDE",
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importSyntheseDesResultats")
      .resolve("importSyntheseDesResultatsAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(400);
    expect(response._getJSONData().erreurs).toBeDefined();
  });

  it("retourne 400 quand la date est dans le futur", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();
    await créerDonnéesDeRéférence(chantierId);
    const utilisateurAuthentifié = créerUtilisateurAuthentifié(
      auteurId,
      chantierId,
    );

    const futurDate = new Date();
    futurDate.setFullYear(futurDate.getFullYear() + 1);
    const futurDateStr = futurDate.toISOString().split("T")[0];

    const body = {
      syntheses_des_resultats: [
        {
          territoire: "NAT-FR",
          contenu: "Synthèse avec date future",
          meteo: "SOLEIL",
          date_synthese: futurDateStr,
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importSyntheseDesResultats")
      .resolve("importSyntheseDesResultatsAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(400);
    expect(response._getJSONData().erreurs).toBeDefined();
  });

  it("retourne 400 quand le territoire n'est pas autorisé", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();
    await créerDonnéesDeRéférence(chantierId);
    // Utilisateur uniquement autorisé sur NAT-FR
    const utilisateurAuthentifié = créerUtilisateurAuthentifié(
      auteurId,
      chantierId,
      { territoires: ["NAT-FR"] },
    );

    const body = {
      syntheses_des_resultats: [
        {
          territoire: "REG-84",
          contenu: "Synthèse sur territoire non autorisé",
          meteo: "SOLEIL",
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importSyntheseDesResultats")
      .resolve("importSyntheseDesResultatsAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(400);
    expect(response._getJSONData().erreurs[0].message).toContain(
      "n'êtes pas autorisé",
    );
  });
});
