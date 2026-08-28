import { $Enums } from "@prisma/client";
import { validationChantierSchema } from "@/components/PageAdminChantiers/useChantierForm";

describe("validationChantierSchema", () => {
  const chantierValide = {
    chantierId: "CH-099",
    chNom: "Chantier",
    chDescr: null,
    chPpg: "PPG-01",
    chTerrito: false,
    chSaisieAte: null,
    chState: $Enums.type_statut.BROUILLON,
    zgApplicable: null,
    porteurIdPrincipal: "MIN-01",
    porteurIdsSecondaires: [],
    porteurIdsDAC: [],
    chPer: "PER-01",
    mailleApplicable: ["NAT"] as const,
    chCibleAttendue: false,
    conseillerMail: null,
  };

  test("rejette un porteur principal vide", () => {
    // Given
    const chantier = { ...chantierValide, porteurIdPrincipal: "" };

    // When
    const résultat = validationChantierSchema.safeParse(chantier);

    // Then
    expect(résultat.success).toBe(false);
  });

  test("accepte un porteur principal renseigné", () => {
    // Given
    const chantier = chantierValide;

    // When
    const résultat = validationChantierSchema.safeParse(chantier);

    // Then
    expect(résultat.success).toBe(true);
  });
});
