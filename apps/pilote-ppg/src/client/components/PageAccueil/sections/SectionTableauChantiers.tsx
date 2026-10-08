import { parseAsStringLiteral, useQueryStates } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import usePageChantiers from "@/components/PageAccueil/PageChantiers/usePageChantiers";
import TableauChantiers from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers";

export const SectionTableauChantiers = () => {
  const {
    chantiers,
    nombreTotalChantiersAvecAlertes,
    ministères,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
    jalon,
  } = usePageAccueilContext();
  const { listeJalonAAfficher } = useSelecteurJalon();

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

  const { donnéesTableauChantiers } = usePageChantiers(
    chantiers,
    territoireCode,
    filtresComptesCalculés,
    avancementsAgrégés,
  );

  return (
    <section className="mt-4" id="tableau-chantiers">
      <Bloc>
        <TitreInfobulleConteneur>
          <h2 className="text-lg mb-0 py-1 leading-6 inline">
            {`Liste des chantiers (${nombreTotalChantiersAvecAlertes})`}
          </h2>
        </TitreInfobulleConteneur>
        <TableauChantiers
          chantiersSontArchives={chantiersSontArchives}
          données={donnéesTableauChantiers}
          jalon={jalon}
          ministèresDisponibles={ministères}
          nombreTotalChantiersAvecAlertes={nombreTotalChantiersAvecAlertes}
          territoireCode={territoireCode}
        />
      </Bloc>
    </section>
  );
};
