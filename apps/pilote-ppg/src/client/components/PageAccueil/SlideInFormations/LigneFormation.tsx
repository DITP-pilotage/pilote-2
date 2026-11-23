import { Icone } from "@/components/_commons/Icone";
import { ArrowDownSLineIcon } from "@/components/_commons/Icones/ArrowDownSLineIcon";
import { TimeIcon } from "@/components/_commons/Icones/TimeIcon";
import { Button } from "@/components/shared/Button";
import { Collapsible } from "@/components/shared/Collapsible";
import { TextLink } from "@/components/shared/TextLink";
import type {
  FormationProposee,
  SeanceProposee,
} from "@/server/formations/queries/GetFormationsAProposerQuery";
import {
  formaterDebutSeance,
  formaterDuree,
  formaterPlacesRestantes,
} from "./formaterSeance";

const horaire = (seance: SeanceProposee) =>
  `${formaterDebutSeance(seance.dateDebut)} · ${formaterDuree(seance.dureeMinutes)}`;

const titreInscription = (
  formation: FormationProposee,
  seance: SeanceProposee,
) => `S'inscrire à ${formation.nom}, ${horaire(seance)} (nouvelle fenêtre)`;

const AutresSeances = ({
  formation,
  seances,
}: {
  formation: FormationProposee;
  seances: SeanceProposee[];
}) => (
  <Collapsible.Root>
    <Collapsible.Trigger asChild>
      <Button
        className="group -ml-3 max-md:min-h-11"
        iconRight={
          <span aria-hidden="true" className="flex">
            <Icone
              className="h-4 w-4 text-current transition-transform group-data-[state=open]:rotate-180"
              icone={ArrowDownSLineIcon}
            />
          </span>
        }
        size="sm"
        variant="tertiary-no-outline"
      >
        {seances.length === 1
          ? "1 autre date"
          : `${seances.length} autres dates`}
      </Button>
    </Collapsible.Trigger>
    <Collapsible.Content>
      <ul className="m-0 flex list-none flex-col gap-0.5 border-l-2 border-dsfr-blue-france-925 p-0 pl-3">
        {seances.map((seance) => {
          const places = formaterPlacesRestantes(seance.placesRestantes);
          return (
            <li className="text-sm leading-6" key={seance.id}>
              <TextLink
                className="max-md:inline-flex max-md:min-h-11 max-md:items-center"
                href={seance.urlInscription}
                rel="noopener"
                size="sm"
                target="_blank"
                title={titreInscription(formation, seance)}
              >
                {horaire(seance)}
              </TextLink>
              {places ? (
                <span className="text-dsfr-warning-425">{` · ${places}`}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Collapsible.Content>
  </Collapsible.Root>
);

export const LigneFormation = ({
  formation,
}: {
  formation: FormationProposee;
}) => {
  const [prochaine, ...autres] = formation.seances;
  const places = formaterPlacesRestantes(prochaine.placesRestantes);

  return (
    <li className="flex flex-col gap-1 border-t border-dsfr-grey-925 py-2.5">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-bold leading-[21px]">
            {formation.nom}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] leading-[18px] text-dsfr-grey-200">
            <span aria-hidden="true" className="flex">
              <Icone
                className="h-3.5 w-3.5 text-dsfr-mention-grey"
                icone={TimeIcon}
              />
            </span>
            {horaire(prochaine)}
          </span>
          {places ? (
            <span className="text-[13px] leading-[18px] text-dsfr-warning-425">
              {places}
            </span>
          ) : null}
        </div>
        <Button
          asChild
          className="mt-0.5 shrink-0 max-md:min-h-11"
          size="sm"
          variant="secondary"
        >
          <a
            href={prochaine.urlInscription}
            rel="noopener"
            target="_blank"
            title={titreInscription(formation, prochaine)}
          >
            S'inscrire
          </a>
        </Button>
      </div>
      {autres.length > 0 ? (
        <AutresSeances formation={formation} seances={autres} />
      ) : null}
    </li>
  );
};
