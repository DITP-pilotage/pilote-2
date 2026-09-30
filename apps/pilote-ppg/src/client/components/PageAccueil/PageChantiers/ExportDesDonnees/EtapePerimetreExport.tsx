import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { Modale } from "@/components/shared/Modale";
import { RadioGroup } from "@/components/shared/RadioGroup";

export const EtapePerimetreExport = () => {
  const [isAvecFiltre, setIsAvecFiltre] = useQueryState(
    "isAvecFiltre",
    parseAsBoolean.withDefault(false).withOptions({
      shallow: true,
    }),
  );

  const [, setEtapeCourante] = useQueryState(
    "etapeCourante",
    parseAsInteger.withOptions({
      shallow: true,
      history: "push",
    }),
  );

  return (
    <div>
      <p className="fr-mb-1w">Précisez le périmètre de votre export :</p>
      <RadioGroup.Root
        name="ressource-à-exporter"
        onValueChange={(valeur) => setIsAvecFiltre(valeur === "indicateurs")}
        value={isAvecFiltre ? "indicateurs" : "chantiers"}
      >
        <RadioGroup.Item
          id="chantiers"
          libelle="exporter tous les éléments sur tous les territoires qui vous sont ouverts en lecture"
          value="chantiers"
        />
        <RadioGroup.Item
          aide="le cas échéant, le territoire sélectionné et tous les territoires inclus aux mailles inférieures seront intégrés dans l'export"
          id="indicateurs"
          libelle="exporter les éléments de la sélection présentement active dans PILOTE"
          value="indicateurs"
        />
      </RadioGroup.Root>
      <div className="w-full flex justify-end fr-mt-2w">
        <Modale.Close asChild>
          <button
            className="fr-link fr-mr-2w"
            title="Fermer la fenêtre modale"
            type="button"
          >
            Annuler
          </button>
        </Modale.Close>
        <button
          className="fr-btn fr-btn--secondary fr-mr-2w"
          onClick={() => setEtapeCourante(1)}
          type="button"
        >
          Étape précédente
        </button>
        <button
          className="fr-btn fr-mr-2w"
          onClick={() => setEtapeCourante(3)}
          type="button"
        >
          Étape suivante
        </button>
      </div>
    </div>
  );
};
