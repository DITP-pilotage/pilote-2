import { Fragment, FunctionComponent } from "react";
import Link from "next/link";
import { EnveloppeContourIcon } from "@/components/_commons/Icones/EnveloppeContourIcon";
import { Icone } from "@/components/_commons/Icone";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import { TextLink } from "@/components/shared/TextLink";

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
      <div className="flex flex-wrap -m-2 lg:-m-3 pb-4">
        <div className="px-2 pt-2 lg:px-3 w-2/3 shrink-0 md:w-1/3 xl:w-5/12 text-sm print:text-base font-bold m-0 pb-1 md:py-2">
          {libellé}
        </div>
        <p className="px-2 pt-2 w-7/12 shrink-0 md:w-1/3 xl:w-5/12 text-sm print:text-base m-0 pb-1 md:p-2">
          {responsables.length > 0
            ? responsables.map((r, i) => (
                <Fragment key={r.nom}>
                  <NomUtilisateurAvecTooltip
                    nom={r.nom}
                    service={r.service}
                    fonction={r.fonction}
                  />
                  {i < responsables.length - 1 && ", "}
                </Fragment>
              ))
            : "Non renseigné"}
        </p>
        {libelleEmailsResponsables ? (
          <div className="p-2 lg:p-3 w-5/12 shrink-0 md:w-1/3 xl:w-1/6 flex items-start justify-end max-[450px]:items-end print:hidden">
            <div className="flex items-start">
              <Icone
                className="mr-1 text-dsfr-blue-france-sun-113"
                icone={EnveloppeContourIcon}
              />
              <TextLink asChild size="sm">
                <Link
                  href={`mailto:${libelleEmailsResponsables}?subject=${objetCourriel}`}
                  title={`Contacter ${libelleEmailsResponsables}`}
                >
                  Contacter
                </Link>
              </TextLink>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ResponsablesLigneChantier;
