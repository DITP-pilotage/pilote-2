import { checkAlbertAccess } from "@/server/albert-access/domain/checkAlbertAccess";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const aucunAcces = {
  killSwitch: true,
  profilActive: false,
  utilisateurAutorise: false,
};

describe("checkAlbertAccess", () => {
  it("refuse tout le monde quand le kill switch est coupé, DITP_ADMIN compris", () => {
    const result = checkAlbertAccess({
      killSwitch: false,
      profil: ProfilEnum.DITP_ADMIN,
      profilActive: true,
      utilisateurAutorise: true,
    });

    expect(result.peutUtiliser).toBe(false);
  });

  it("autorise toujours DITP_ADMIN, sans aucune permission en base", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.DITP_ADMIN,
    });

    expect(result.peutUtiliser).toBe(true);
  });

  it("autorise un utilisateur dont le profil est activé", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.COORDINATEUR_REGION,
      profilActive: true,
    });

    expect(result.peutUtiliser).toBe(true);
  });

  it("autorise un utilisateur autorisé individuellement", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.PREFET_REGION,
      utilisateurAutorise: true,
    });

    expect(result.peutUtiliser).toBe(true);
  });

  it("refuse un utilisateur ni activé par son profil ni autorisé individuellement", () => {
    const result = checkAlbertAccess({
      ...aucunAcces,
      profil: ProfilEnum.DITP_PILOTAGE,
    });

    expect(result.peutUtiliser).toBe(false);
  });

  it("refuse une session sans profil et lui attribue les scénarios coordinateur", () => {
    const result = checkAlbertAccess({ ...aucunAcces, profil: null });

    expect(result).toEqual({ peutUtiliser: false, scenarios: "coordinateur" });
  });

  it.each([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE])(
    "propose les scénarios DITP au profil %s",
    (profil) => {
      expect(checkAlbertAccess({ ...aucunAcces, profil }).scenarios).toBe(
        "ditp",
      );
    },
  );

  it.each([
    ProfilEnum.EQUIPE_DIR_PROJET,
    ProfilEnum.COORDINATEUR_REGION,
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
    ProfilEnum.PREFET_DEPARTEMENT,
  ])("propose les scénarios coordinateur au profil %s", (profil) => {
    expect(checkAlbertAccess({ ...aucunAcces, profil }).scenarios).toBe(
      "coordinateur",
    );
  });
});
