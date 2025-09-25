import { FunctionComponent } from "react";
import Link from "next/dist/client/link";
import { libellesTypologieIndicateur } from "@/client/utils/indicateur/indicateur";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { EnveloppeContourIcon } from "@/components/_commons/Icones/EnveloppeContourIcon";
import { Icone } from "@/components/_commons/Icone";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
import IndicateurSpécificationsStyled from "./IndicateurSpécifications.styled";

interface IndicateurSpécificationsProps {
  dateValeurAvancement: string | null;
  dateProchaineDateMaj: string | null;
  dateProchaineDateValeurAvancement: string | null;
  responsablesMails: string[];
}

const IndicateurSpécifications: FunctionComponent<
  IndicateurSpécificationsProps
> = ({
  dateProchaineDateMaj,
  dateProchaineDateValeurAvancement,
  dateValeurAvancement,
  responsablesMails,
}) => {
  const {
    detailIndicateurDuTerritoire,
    indicateur,
    configurationFeatureFlipping,
  } = useBlocIndicateurContext();

  const libelléValeurNull = "Non renseignée";
  const objectMail = `PILOTE - Indicateur ${indicateur.nom} (${indicateur.id})`;
  const variableContenuFFPoserUneQuestion =
    configurationFeatureFlipping.poserUneQuestionIndicateur;

  return (
    <IndicateurSpécificationsStyled>
      <p className="fr-text--md sous-titre">Description de l'indicateur</p>
      <p className="fr-text--sm">
        {indicateur.description ?? libelléValeurNull}
      </p>
      <p className="fr-text--md sous-titre fr-mt-2w">
        Typologie de l'indicateur
      </p>
      <p className="fr-text--sm">
        {libellesTypologieIndicateur[indicateur.type]}
      </p>
      <p className="fr-text--md sous-titre fr-mt-2w">Méthode de calcul</p>
      <p className="fr-text--sm">
        {indicateur.modeDeCalcul ?? libelléValeurNull}
      </p>
      <p className="fr-text--md sous-titre fr-mt-2w">Source</p>
      <p className="fr-text--sm">{indicateur.source ?? libelléValeurNull}</p>
      <p className="fr-text--md sous-titre fr-mt-2w">Mise à jour</p>
      {!detailIndicateurDuTerritoire.est_applicable ? (
        <p className="fr-text--sm">
          L'indicateur n'est pas applicable sur le territoire.
        </p>
      ) : !!dateProchaineDateMaj ? (
        <>
          <p className="fr-text--sm">
            La période de mise à jour pour cet indicateur est :{" "}
            <span className="fr-text--bold">
              {indicateur.periodicite ?? libelléValeurNull}
            </span>
          </p>
          <p className="fr-text--sm">
            La date de valeur d'avancement de cet indicateur est :{" "}
            <span className="fr-text--bold">
              {`${dateValeurAvancement ?? libelléValeurNull}.`}
            </span>{" "}
            La date de la prochaine valeur d'avancement sera donc :{" "}
            <span className="fr-text--bold">
              {`${dateProchaineDateValeurAvancement ?? libelléValeurNull}.`}
            </span>
          </p>
          <p className="fr-text--sm">
            La mise à disposition d'une nouvelle valeur pour cet indicateur
            nécessite un délai de disponibilité de{" "}
            <span className="fr-text--bold">
              {indicateur.delaiDisponibilite
                ? `${indicateur.delaiDisponibilite} mois.`
                : "Non renseigné"}
            </span>{" "}
            {`De ce fait, la mise à jour de la prochaine valeur d'avancement est requise ${detailIndicateurDuTerritoire.estAJour ? "au plus tard à" : "depuis"} la date :`}{" "}
            <span className="fr-text--bold">
              {`${dateProchaineDateMaj ?? libelléValeurNull}.`}
            </span>
          </p>
        </>
      ) : (
        <>
          {!!dateValeurAvancement ? (
            <p className="fr-text--sm">
              La période de mise à jour pour cet indicateur et/ou le délai de
              disponibilité ne sont pas renseignés.
            </p>
          ) : (
            <p className="fr-text--sm">
              La valeur d'avancement de cet indicateur est non renseignée.
            </p>
          )}
          <p className="fr-text--sm">
            De ce fait, la mise à jour de la prochaine valeur d'avancement ne
            peut être calculée.
          </p>
        </>
      )}
      {variableContenuFFPoserUneQuestion ? (
        <div className="fr-mt-3w fr-ml-7w fr-p-2w bg-dsfr-grey-925">
          <div className="flex">
            <Icone
              className="text-primary h-6 w-6 shrink-0 mr-4"
              icone={QuestionIcon}
            />
            <div>
              <p className="fr-text--md sous-titre">
                Poser une question sur cet indicateur
              </p>
              <p className="fr-text fr-text--sm fr-mb-0">
                Des questions ou des remarques sur cet indicateur (définition de
                l'indicateur, données source, méthode de calcul, mise à jour,
                etc.) ? Contactez le responsable des données de la politique
                prioritaire désigné par le directeur de projet pour obtenir plus
                d'informations.
              </p>
            </div>
          </div>
          <div className="flex align-end justify-end">
            <Icone
              className="fr-mr-1v fr-text-title--blue-france fr-mt-2w fr-mt-lg-0"
              icone={EnveloppeContourIcon}
            />
            <Link
              className="fr-link"
              href={`mailto:${responsablesMails.join(", ")}?subject=${objectMail}`}
              title={`Contacter ${responsablesMails.join(", ")}`}
            >
              Contacter
            </Link>
          </div>
        </div>
      ) : null}
    </IndicateurSpécificationsStyled>
  );
};

export default IndicateurSpécifications;
