import { Fragment, FunctionComponent } from "react";
import Link from "next/link";
import { EnveloppeContourIcon } from "@/components/_commons/Icones/EnveloppeContourIcon";
import { Icone } from "@/components/_commons/Icone";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";

interface Responsable {
  nom: string;
  service: string | null;
  fonction: string | null;
}

interface ResponsablesLigneProps {
  libellé: string;
  responsables: Responsable[];
  libelleEmailsResponsables: string;
  libelléChantier: string;
}

const ResponsablesLigneChantier: FunctionComponent<ResponsablesLigneProps> = ({
  libellé,
  responsables,
  libelleEmailsResponsables,
  libelléChantier,
}) => {
  const objetCourriel = encodeURIComponent(`PILOTE - PPG - ${libelléChantier}`);

  return (
    <section>
      <div className="fr-grid-row fr-grid-row--gutters fr-pb-2w">
        <div className="fr-text--sm fr-text--bold fr-col-8 fr-col-md-4 fr-col-xl-5 fr-m-0 fr-pb-1v fr-py-md-1w">
          {libellé}
        </div>
        <p className="fr-text--sm fr-col-7 fr-col-md-4 fr-col-xl-5 fr-m-0 fr-pb-1v fr-p-md-1w">
          {responsables.length > 0 ? (
            responsables.map((r, i) => (
              <Fragment key={r.nom}>
                <NomUtilisateurAvecTooltip
                  nom={r.nom}
                  service={r.service}
                  fonction={r.fonction}
                />
                {i < responsables.length - 1 && ", "}
              </Fragment>
            ))
          ) : (
            "Non renseigné"
          )}
        </p>
        {libelleEmailsResponsables ? (
          <div className="fr-col-5 fr-col-md-4 fr-col-xl-2 flex align-start justify-end max-[450px]:items-end print:hidden">
            <div className="flex align-start">
              <Icone
                className="fr-mr-1v fr-text-title--blue-france"
                icone={EnveloppeContourIcon}
              />
              <Link
                className="fr-link fr-link--sm"
                href={`mailto:${libelleEmailsResponsables}?subject=${objetCourriel}`}
                title={`Contacter ${libelleEmailsResponsables}`}
              >
                Contacter
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ResponsablesLigneChantier;
