import { FunctionComponent, useMemo } from "react";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { useAjouterChantierAuxHabilitations } from "@/components/PageHabilitationsCoordinateur/useAjouterChantierAuxHabilitations";

const PageHabilitationsCoordinateur: FunctionComponent = () => {
  const {
    chantiers,
    chantierIdsSelectionnes,
    changerSelectionChantiers,
    ajouterAuxHabilitations,
    isLoading,
  } = useAjouterChantierAuxHabilitations();

  const optionGroups = useMemo(
    () => [
      {
        label: "Chantiers territorialisés",
        options: chantiers.map((chantier) => chantier.id),
      },
    ],
    [chantiers],
  );

  const labelsParId = useMemo(
    () =>
      new Map(
        chantiers.map((chantier) => [
          chantier.id,
          `${chantier.nom} (${chantier.id})`,
        ]),
      ),
    [chantiers],
  );

  return (
    <>
      <h2>Habilitations coordinateurs</h2>

      <div className="fr-mt-3w">
        <MultiSelectFiltre
          getOptionLabel={(id) => labelsParId.get(id) ?? id}
          label="Chantiers territorialisés"
          classNameBouton="w-120"
          onChange={changerSelectionChantiers}
          optionGroups={optionGroups}
          showGroupSelection={false}
          values={chantierIdsSelectionnes}
        />
      </div>

      <div className="fr-btns-group fr-btns-group--inline fr-mt-3w">
        <button
          className="fr-btn"
          disabled={chantierIdsSelectionnes.length === 0 || isLoading}
          onClick={() => ajouterAuxHabilitations("saisieCommentaire")}
          type="button"
        >
          Ajouter en saisie commentaire
        </button>
        <button
          className="fr-btn fr-btn--secondary"
          disabled={chantierIdsSelectionnes.length === 0 || isLoading}
          onClick={() => ajouterAuxHabilitations("gestionUtilisateur")}
          type="button"
        >
          Ajouter en gestion utilisateur
        </button>
      </div>
    </>
  );
};

export default PageHabilitationsCoordinateur;
