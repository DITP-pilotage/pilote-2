import { parseAsStringLiteral, useQueryStates } from "nuqs";
import { useEnv } from "@/client/hooks/useEnv";
import Titre from "@/components/_commons/Titre/Titre";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import BadgeIcône from "@/components/_commons/BadgeIcône/BadgeIcône";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import RemontéeAlerte from "@/components/_commons/RemontéeAlerteChantier/RemontéeAlerte";
import { WidgetRepartitionMeteos } from "@/components/_commons/Widget/WidgetRepartitionMeteos/WidgetRepartitionMeteos";
import { WidgetChantiersSignales } from "@/components/_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import usePageChantiers from "@/components/PageAccueil/PageChantiers/usePageChantiers";

export const SectionChantiersSignales = () => {
  const {
    chantiers,
    chantierIds,
    chantierIdsSansFiltrageAlertes,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
    jalonParDefaut,
  } = usePageAccueilContext();
  const { listeJalonAAfficher } = useSelecteurJalon();

  const ffAlertesBaisse = useEnv("NEXT_PUBLIC_FF_ALERTES_BAISSE");
  const featureChantiersSignalesV2 = useEnv(
    "NEXT_PUBLIC_FF_CHANTIERS_SIGNALES_V2",
  );
  const featureRepartitionMeteosV2 = useEnv(
    "NEXT_PUBLIC_FF_REPARTITION_METEOS_V2",
  );

  const [filtres] = useQueryStates({
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(listeJalonAAfficher),
  });

  const chantiersSontArchives = filtres.statut?.includes("ARCHIVE") ?? false;

  const { remontéesAlertes } = usePageChantiers(
    chantiers,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
  );

  if (chantiersSontArchives) return null;

  return (
    <section id="chantiers-signales">
      <div className="pt-4 px-4 md:px-0">
        <div className="mb-4">
          <TitreInfobulleConteneur>
            <BadgeIcône type="warning" />
            <Titre
              baliseHtml="h2"
              className="fr-text--lg fr-mb-0 fr-py-1v ml-2 !text-dsfr-warning-425 leading-6"
              estInline
            >
              Chantiers signalés
            </Titre>
            <Infobulle classNameBouton="!text-dsfr-warning-425">
              {INFOBULLE_CONTENUS.chantiers.alertes}
            </Infobulle>
          </TitreInfobulleConteneur>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {remontéesAlertes.map(
            ({ nomCritère, libellé, nombre, estActivée }) =>
              (ffAlertesBaisse || nomCritère !== "estEnAlerteBaisse") && (
                <div key={libellé} title={libellé}>
                  <RemontéeAlerte
                    estActivée={estActivée}
                    libellé={libellé}
                    nomCritère={nomCritère}
                    nombre={nombre}
                  />
                </div>
              ),
          )}
        </div>
      </div>
      {featureChantiersSignalesV2 ? (
        <div className="pt-4 px-4 md:px-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featureRepartitionMeteosV2 ? (
            <WidgetRepartitionMeteos
              chantierIds={chantierIds}
              territoireCode={territoireCode}
            />
          ) : null}
          <WidgetChantiersSignales
            chantierIds={chantierIdsSansFiltrageAlertes}
            jalonParDefaut={jalonParDefaut}
            territoireCode={territoireCode}
          />
        </div>
      ) : null}
    </section>
  );
};
