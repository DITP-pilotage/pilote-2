import {
  AgregateurListeChantiersParTerritoire,
  ChantierPourAgregation,
} from "./agregateur";

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

describe("AgregateurListeChantiersParTerritoire", () => {
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
                dateTauxAvancementAnnuel: null,
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
          agregat.departementale.territoires["DEPT-01"].repartition,
        ).toStrictEqual({
          avancements: {
            global: { moyenne: 80, mediane: 80, minimum: 80, maximum: 80 },
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
                dateTauxAvancementAnnuel: null,
              },
            },
          }),
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: 80, annuel: 70 },
                dateTauxAvancementAnnuel: null,
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
          agregat.departementale.territoires["DEPT-01"].repartition,
        ).toStrictEqual({
          avancements: {
            global: { moyenne: 70, mediane: 70, minimum: 60, maximum: 80 },
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
                dateTauxAvancementAnnuel: null,
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
          agregat.departementale.territoires["DEPT-01"].repartition,
        ).toStrictEqual({
          avancements: {
            global: {
              moyenne: null,
              mediane: null,
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
                dateTauxAvancementAnnuel: null,
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
          agregat.departementale.territoires["DEPT-01"].repartition,
        ).toStrictEqual({
          avancements: {
            global: {
              moyenne: null,
              mediane: null,
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
                dateTauxAvancementAnnuel: null,
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
          agregat.departementale.territoires["DEPT-01"].repartition,
        ).toStrictEqual({
          avancements: {
            global: {
              moyenne: null,
              mediane: null,
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
                dateTauxAvancementAnnuel: null,
              },
            },
          }),
          creerChantier({
            nationale: {
              "NAT-FR": {
                estApplicable: true,
                avancement: { global: 80, annuel: 70 },
                dateTauxAvancementAnnuel: null,
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
          agregat.nationale.territoires["NAT-FR"].repartition.avancements.global
            .mediane,
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
                dateTauxAvancementAnnuel: null,
              },
              "DEPT-02": {
                estApplicable: true,
                avancement: { global: 90, annuel: 80 },
                dateTauxAvancementAnnuel: null,
              },
            },
          }),
          creerChantier({
            departementale: {
              "DEPT-01": {
                estApplicable: true,
                avancement: { global: 80, annuel: 70 },
                dateTauxAvancementAnnuel: null,
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
        expect(agregat.departementale.repartition).toStrictEqual({
          avancements: {
            global: {
              moyenne: (60 + 80 + 90) / 3,
              mediane: 80,
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
      expect(agrégat.nationale.territoires["NAT-FR"].repartition).toStrictEqual(
        {
          avancements: {
            global: {
              moyenne: null,
              mediane: null,
              minimum: null,
              maximum: null,
            },
            annuel: { moyenne: null },
          },
        },
      );
      expect(agrégat.nationale.repartition).toStrictEqual({
        avancements: {
          global: {
            moyenne: null,
            mediane: null,
            minimum: null,
            maximum: null,
          },
          annuel: { moyenne: null },
        },
      });
    });
  });
});
