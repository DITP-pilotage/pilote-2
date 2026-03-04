import {
  AgregateurListeChantiersParTerritoire,
  ChantierPourAgregation,
} from "./agrégateur";

function creerChantier(
  maillesTerritoires: Partial<ChantierPourAgregation["mailles"]>,
): ChantierPourAgregation {
  return {
    mailles: {
      nationale: {},
      departementale: {},
      regionale: {},
      ...maillesTerritoires,
    },
  };
}

describe("AgrégateurListeChantiersParTerritoire", () => {
  describe("Par territoire", () => {
    describe("Avec 1 chantier applicable sur DEPT-01", () => {
      it("Retourne les stats correspondant à ce chantier", () => {
        //GIVEN
        const chantiers = [
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: 80, annuel: 70 },
              },
            },
          }),
        ];
        //WHEN
        const agregat = new AgregateurListeChantiersParTerritoire(
          chantiers,
        ).agreger();
        //THEN
        expect(
          agregat.departementale.territoires["DEPT-01"].répartition,
        ).toStrictEqual({
          avancements: {
            global: { moyenne: 80, médiane: 80, minimum: 80, maximum: 80 },
            annuel: { moyenne: 70 },
          },
        });
      });
    });

    describe("Avec 2 chantiers applicables sur DEPT-01", () => {
      it("Calcule correctement moyenne, médiane, min, max", () => {
        //GIVEN
        const chantiers = [
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: 60, annuel: 50 },
              },
            },
          }),
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: 80, annuel: 70 },
              },
            },
          }),
        ];
        //WHEN
        const agregat = new AgregateurListeChantiersParTerritoire(
          chantiers,
        ).agreger();
        //THEN
        expect(
          agregat.departementale.territoires["DEPT-01"].répartition,
        ).toStrictEqual({
          avancements: {
            global: { moyenne: 70, médiane: 70, minimum: 60, maximum: 80 },
            annuel: { moyenne: 60 },
          },
        });
      });
    });

    describe("Avec estApplicable false", () => {
      it("Exclut le chantier des statistiques", () => {
        //GIVEN
        const chantiers = [
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: false,
                avancement: { global: 80, annuel: 70 },
              },
            },
          }),
        ];
        //WHEN
        const agregat = new AgregateurListeChantiersParTerritoire(
          chantiers,
        ).agreger();
        //THEN
        expect(
          agregat.departementale.territoires["DEPT-01"].répartition,
        ).toStrictEqual({
          avancements: {
            global: {
              moyenne: null,
              médiane: null,
              minimum: null,
              maximum: null,
            },
            annuel: { moyenne: null },
          },
        });
      });
    });

    describe("Avec estApplicable null", () => {
      it("Exclut le chantier des statistiques", () => {
        //GIVEN
        const chantiers = [
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: null,
                avancement: { global: 80, annuel: 70 },
              },
            },
          }),
        ];
        //WHEN
        const agregat = new AgregateurListeChantiersParTerritoire(
          chantiers,
        ).agreger();
        //THEN
        expect(
          agregat.departementale.territoires["DEPT-01"].répartition,
        ).toStrictEqual({
          avancements: {
            global: {
              moyenne: null,
              médiane: null,
              minimum: null,
              maximum: null,
            },
            annuel: { moyenne: null },
          },
        });
      });
    });

    describe("Avec un chantier applicable mais avancements null", () => {
      it("Retourne toutes les stats à null", () => {
        //GIVEN
        const chantiers = [
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: null, annuel: null },
              },
            },
          }),
        ];
        //WHEN
        const agregat = new AgregateurListeChantiersParTerritoire(
          chantiers,
        ).agreger();
        //THEN
        expect(
          agregat.departementale.territoires["DEPT-01"].répartition,
        ).toStrictEqual({
          avancements: {
            global: {
              moyenne: null,
              médiane: null,
              minimum: null,
              maximum: null,
            },
            annuel: { moyenne: null },
          },
        });
      });
    });

    describe("Avec 2 chantiers applicables sur NAT-FR", () => {
      it("Calcule la médiane comme moyenne des deux valeurs médianes pour un nombre pair", () => {
        //GIVEN
        // 2 valeurs [60, 80] → médiane = (60+80)/2 = 70
        const chantiers = [
          creerChantier({
            nationale: {
              "NAT-FR": {
                estApplicable: true,
                avancement: { global: 60, annuel: 50 },
              },
            },
          }),
          creerChantier({
            nationale: {
              "NAT-FR": {
                estApplicable: true,
                avancement: { global: 80, annuel: 70 },
              },
            },
          }),
        ];
        //WHEN
        const agregat = new AgregateurListeChantiersParTerritoire(
          chantiers,
        ).agreger();
        //THEN
        expect(
          agregat.nationale.territoires["NAT-FR"].répartition.avancements.global
            .médiane,
        ).toStrictEqual(70);
      });
    });
  });

  describe("Par maille", () => {
    describe("Avec chantiers applicables sur DEPT-01 et DEPT-02", () => {
      it("Agrège les valeurs de tous les territoires au niveau maille", () => {
        //GIVEN
        const chantiers = [
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: 60, annuel: 50 },
              },
              "DEPT-02": {
                estApplicable: true,
                avancement: { global: 90, annuel: 80 },
              },
            },
          }),
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: 80, annuel: 70 },
              },
            },
          }),
        ];
        //WHEN
        const agregat = new AgregateurListeChantiersParTerritoire(
          chantiers,
        ).agreger();
        //THEN
        // global values: [60, 80, 90] → moyenne=230/3, médiane=80, min=60, max=90
        // annuel values: [50, 70, 80] → moyenne=200/3
        expect(agregat.departementale.répartition).toStrictEqual({
          avancements: {
            global: {
              moyenne: (60 + 80 + 90) / 3,
              médiane: 80,
              minimum: 60,
              maximum: 90,
            },
            annuel: { moyenne: (50 + 70 + 80) / 3 },
          },
        });
      });
    });
  });

  describe("Cas limite : liste de chantiers vide", () => {
    it("Retourne toutes les stats à null", () => {
      //GIVEN
      const chantiers: ChantierPourAgregation[] = [];
      //WHEN
      const agrégat = new AgregateurListeChantiersParTerritoire(
        chantiers,
      ).agreger();
      //THEN
      expect(agrégat.nationale.territoires["NAT-FR"].répartition).toStrictEqual(
        {
          avancements: {
            global: {
              moyenne: null,
              médiane: null,
              minimum: null,
              maximum: null,
            },
            annuel: { moyenne: null },
          },
        },
      );
      expect(agrégat.nationale.répartition).toStrictEqual({
        avancements: {
          global: {
            moyenne: null,
            médiane: null,
            minimum: null,
            maximum: null,
          },
          annuel: { moyenne: null },
        },
      });
    });
  });
});
