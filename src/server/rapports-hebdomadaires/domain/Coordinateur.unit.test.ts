import {
  Coordinateur,
  aDesDroitsSurTerritoire,
  TerritoireCoordinateur,
} from "./Coordinateur";

describe("aDesDroitsSurTerritoire", () => {
  const createCoordinateur = (
    territoires: TerritoireCoordinateur[],
  ): Coordinateur => ({
    id: "coord-1",
    email: "coord@example.com",
    nom: "Dupont",
    prenom: "Jean",
    profil: "COORDINATEUR_REGION",
    territoires,
    chantiers: [],
    perimetres: [],
  });

  describe("pas de territoires à comparer", () => {
    it("retourne false", () => {
      const coordinateur = createCoordinateur([
        { code: "REG-01", nom: "Île-de-France", maille: "REG", enfants: [] },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: [],
      });

      expect(result).toBe(false);
    });
  });

  describe("quand il n'y a aucune intersection", () => {
    it("retourne false quand le coordinateur a un territoire et tous les territoires sont différents", () => {
      const coordinateur = createCoordinateur([
        { code: "REG-01", nom: "Île-de-France", maille: "REG", enfants: [] },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["REG-02"],
      });

      expect(result).toBe(false);
    });

    it("retourne false quand le coordinateur a plusieurs territoires et les territoires sont différents", () => {
      const coordinateur = createCoordinateur([
        { code: "REG-01", nom: "Île-de-France", maille: "REG", enfants: [] },
        { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["REG-02", "DEPT-69"],
      });

      expect(result).toBe(false);
    });
  });

  describe("quand il y a une intersection", () => {
    it("retourne true quand le coordinateur a un territoire correspondant à un territoire", () => {
      const coordinateur = createCoordinateur([
        { code: "REG-01", nom: "Île-de-France", maille: "REG", enfants: [] },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["REG-01"],
      });

      expect(result).toBe(true);
    });

    it("retourne true quand au moins un des territoires correspond au coordinateur", () => {
      const coordinateur = createCoordinateur([
        { code: "REG-01", nom: "Île-de-France", maille: "REG", enfants: [] },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["REG-02", "REG-01", "REG-03"],
      });

      expect(result).toBe(true);
    });

    it("retourne true quand le coordinateur a plusieurs territoires et au moins un correspond", () => {
      const coordinateur = createCoordinateur([
        { code: "REG-01", nom: "Île-de-France", maille: "REG", enfants: [] },
        { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
        { code: "DEPT-92", nom: "Hauts-de-Seine", maille: "DEPT", enfants: [] },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["DEPT-69", "DEPT-92"],
      });

      expect(result).toBe(true);
    });

    it("retourne true quand plusieurs territoires correspondent des deux côtés", () => {
      const coordinateur = createCoordinateur([
        { code: "REG-01", nom: "Île-de-France", maille: "REG", enfants: [] },
        { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
        { code: "DEPT-92", nom: "Hauts-de-Seine", maille: "DEPT", enfants: [] },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["DEPT-75", "DEPT-92", "REG-02"],
      });

      expect(result).toBe(true);
    });
  });

  describe("quand le coordinateur a des territoires avec enfants", () => {
    it("retourne true quand un enfant correspond au territoire recherché", () => {
      const coordinateur = createCoordinateur([
        {
          code: "REG-01",
          nom: "Île-de-France",
          maille: "REG",
          enfants: [
            { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
            {
              code: "DEPT-92",
              nom: "Hauts-de-Seine",
              maille: "DEPT",
              enfants: [],
            },
          ],
        },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["DEPT-75"],
      });

      expect(result).toBe(true);
    });

    it("retourne true quand le territoire parent correspond", () => {
      const coordinateur = createCoordinateur([
        {
          code: "REG-01",
          nom: "Île-de-France",
          maille: "REG",
          enfants: [
            { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
          ],
        },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["REG-01"],
      });

      expect(result).toBe(true);
    });

    it("retourne false quand ni le parent ni les enfants ne correspondent", () => {
      const coordinateur = createCoordinateur([
        {
          code: "REG-01",
          nom: "Île-de-France",
          maille: "REG",
          enfants: [
            { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
            {
              code: "DEPT-92",
              nom: "Hauts-de-Seine",
              maille: "DEPT",
              enfants: [],
            },
          ],
        },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["DEPT-69"],
      });

      expect(result).toBe(false);
    });

    it("retourne true quand plusieurs enfants correspondent", () => {
      const coordinateur = createCoordinateur([
        {
          code: "REG-01",
          nom: "Île-de-France",
          maille: "REG",
          enfants: [
            { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
            {
              code: "DEPT-92",
              nom: "Hauts-de-Seine",
              maille: "DEPT",
              enfants: [],
            },
          ],
        },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["DEPT-75", "DEPT-92"],
      });

      expect(result).toBe(true);
    });

    it("retourne true quand au moins un enfant correspond parmi plusieurs codes", () => {
      const coordinateur = createCoordinateur([
        {
          code: "REG-01",
          nom: "Île-de-France",
          maille: "REG",
          enfants: [
            { code: "DEPT-75", nom: "Paris", maille: "DEPT", enfants: [] },
          ],
        },
      ]);

      const result = aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: ["DEPT-69", "DEPT-75", "DEPT-13"],
      });

      expect(result).toBe(true);
    });
  });
});
