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
}

function créerUtilisateurAuthentifié(auteurId: string, chantierId: string) {
  return UtilisateurAuthentifie.creerUtilisateurAuthentifie({
    id: auteurId,
    email: "test@test.com",
    profil: ProfilEnum.EQUIPE_DIR_PROJET,
    profilAAccèsAuxChantiersBrouillons: false,
    habilitations: {
      lecture: {
        chantiers: [chantierId],
        territoires: ["NAT-FR"],
        périmètres: [],
      },
      saisieCommentaire: {
        chantiers: [chantierId],
        territoires: ["NAT-FR"],
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

describe("ImportObjectifAPIHandler", () => {
  it("importe un objectif valide et le persiste en base", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();
    await créerDonnéesDeRéférence(chantierId);
    const utilisateurAuthentifié = créerUtilisateurAuthentifié(
      auteurId,
      chantierId,
    );

    const body = {
      objectifs: [
        {
          type: "notre_ambition",
          contenu: "Contenu de l'objectif de test",
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importObjectif")
      .resolve("importObjectifAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(200);
    expect(response._getJSONData().message).toEqual(
      "Les objectifs ont correctement été importés",
    );

    const objectifsEnBase = await prisma.objectif.findMany({
      where: { chantier_id: chantierId },
    });
    expect(objectifsEnBase).toHaveLength(1);
    expect(objectifsEnBase[0].contenu).toEqual("Contenu de l'objectif de test");
    expect(objectifsEnBase[0].type).toEqual("notre_ambition");
    expect(objectifsEnBase[0].auteur_id).toEqual(auteurId);
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
    await getContainer("importObjectif")
      .resolve("importObjectifAPIHandler")
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
      objectifs: [
        {
          type: "notre_ambition",
          contenu: "Tentative non autorisée",
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importObjectif")
      .resolve("importObjectifAPIHandler")
      .handle({
        request,
        response,
        chantierId,
        utilisateurAuthentifie: utilisateurAuthentifié,
      });

    // Then
    expect(response._getStatusCode()).toEqual(403);
  });

  it("retourne 400 quand le type est invalide (validation Zod)", async () => {
    // Given
    const chantierId = `CH-${randomUUID().slice(0, 6)}`;
    const auteurId = await créerUtilisateurEnBase();
    await créerDonnéesDeRéférence(chantierId);
    const utilisateurAuthentifié = créerUtilisateurAuthentifié(
      auteurId,
      chantierId,
    );

    const body = {
      objectifs: [
        {
          type: "type_inexistant",
          contenu: "Objectif avec type invalide",
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importObjectif")
      .resolve("importObjectifAPIHandler")
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
      objectifs: [
        {
          type: "notre_ambition",
          contenu: "Objectif avec date future",
          date_objectif: futurDateStr,
        },
      ],
    };

    const { request, response } = créerMockRequestAvecBody(body);

    // When
    await getContainer("importObjectif")
      .resolve("importObjectifAPIHandler")
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
});
