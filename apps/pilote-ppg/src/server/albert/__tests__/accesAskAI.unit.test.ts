import {
  calculerAccesAskAI,
  FeatureFlipsAskAI,
} from "@/server/albert/accesAskAI";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

const featureFlipsTousDesactives: FeatureFlipsAskAI = {
  askAI: true,
  ditpAdmin: false,
  equipeDirProjet: false,
  ditpPilotage: false,
  territoire: false,
  coordinateur: false,
};

describe("calculerAccesAskAI", () => {
  it("refuse l'accès quand le feature flip global Ask AI est désactivé", () => {
    // when
    const result = calculerAccesAskAI({
      profil: ProfilEnum.DITP_ADMIN,
      emailAutoriseAskAITerritoire: true,
      featureFlips: {
        ...featureFlipsTousDesactives,
        askAI: false,
        ditpAdmin: true,
        territoire: true,
      },
    });

    // then
    expect(result).toEqual({
      peutUtiliserAskAI: false,
      estEligibleTerritoire: true,
    });
  });

  it("autorise un coordinateur régional quand le feature flip coordinateur est actif", () => {
    // when
    const result = calculerAccesAskAI({
      profil: ProfilEnum.COORDINATEUR_REGION,
      emailAutoriseAskAITerritoire: false,
      featureFlips: { ...featureFlipsTousDesactives, coordinateur: true },
    });

    // then
    expect(result).toEqual({
      peutUtiliserAskAI: true,
      estEligibleTerritoire: false,
    });
  });

  it("autorise un coordinateur départemental quand le feature flip coordinateur est actif", () => {
    // when
    const result = calculerAccesAskAI({
      profil: ProfilEnum.COORDINATEUR_DEPARTEMENT,
      emailAutoriseAskAITerritoire: false,
      featureFlips: { ...featureFlipsTousDesactives, coordinateur: true },
    });

    // then
    expect(result).toEqual({
      peutUtiliserAskAI: true,
      estEligibleTerritoire: false,
    });
  });

  it("refuse un coordinateur quand le feature flip coordinateur est désactivé", () => {
    // when
    const result = calculerAccesAskAI({
      profil: ProfilEnum.COORDINATEUR_REGION,
      emailAutoriseAskAITerritoire: false,
      featureFlips: featureFlipsTousDesactives,
    });

    // then
    expect(result).toEqual({
      peutUtiliserAskAI: false,
      estEligibleTerritoire: false,
    });
  });

  it("autorise un coordinateur via l'allowlist email même sans le feature flip coordinateur", () => {
    // when
    const result = calculerAccesAskAI({
      profil: ProfilEnum.COORDINATEUR_REGION,
      emailAutoriseAskAITerritoire: true,
      featureFlips: { ...featureFlipsTousDesactives, territoire: true },
    });

    // then
    expect(result).toEqual({
      peutUtiliserAskAI: true,
      estEligibleTerritoire: true,
    });
  });

  it("refuse un profil non couvert par les feature flips et absent de l'allowlist", () => {
    // when
    const result = calculerAccesAskAI({
      profil: ProfilEnum.PREFET_REGION,
      emailAutoriseAskAITerritoire: false,
      featureFlips: {
        ...featureFlipsTousDesactives,
        ditpAdmin: true,
        coordinateur: true,
        territoire: true,
      },
    });

    // then
    expect(result).toEqual({
      peutUtiliserAskAI: false,
      estEligibleTerritoire: false,
    });
  });

  it("refuse l'accès quand le profil est inconnu", () => {
    // when
    const result = calculerAccesAskAI({
      profil: null,
      emailAutoriseAskAITerritoire: false,
      featureFlips: { ...featureFlipsTousDesactives, coordinateur: true },
    });

    // then
    expect(result).toEqual({
      peutUtiliserAskAI: false,
      estEligibleTerritoire: false,
    });
  });
});
