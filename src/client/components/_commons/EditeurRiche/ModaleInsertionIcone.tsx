import { useState } from "react";
import { Modale } from "@/client/components/shared/Modale";
import { listeIcones } from "./registreIcones";

export const ModaleInsertionIcone = ({
  open,
  onOpenChange,
  onValider,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValider: (nomIcone: string) => void;
}) => {
  const [recherche, setRecherche] = useState("");
  const [iconeSelectionnee, setIconeSelectionnee] = useState<string | null>(
    null,
  );

  const reinitialiser = () => {
    setRecherche("");
    setIconeSelectionnee(null);
  };

  const iconesFiltrees = recherche
    ? listeIcones.filter((icone) =>
        icone.nom.toLowerCase().includes(recherche.toLowerCase()),
      )
    : listeIcones;

  return (
    <Modale
      onOpenChange={(ouvert) => {
        if (!ouvert) reinitialiser();
        onOpenChange(ouvert);
      }}
      open={open}
      size="lg"
      title="Insérer une icône"
    >
      <div className="flex flex-col gap-4">
        <input
          className="border rounded px-3 py-2 text-sm w-full"
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher une icône..."
          type="text"
          value={recherche}
        />

        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[50vh] overflow-y-auto">
          {iconesFiltrees.map(({ nom, composant: Composant }) => (
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded border text-xs transition-colors ${
                iconeSelectionnee === nom
                  ? "!bg-blue-100 !border-blue-600 !text-blue-800"
                  : "!bg-white !border-gray-200 hover:!bg-gray-50"
              }`}
              key={nom}
              onClick={() => setIconeSelectionnee(nom)}
              title={nom}
              type="button"
            >
              <Composant className="w-6 h-6" fill="currentColor" />
              <span className="truncate w-full text-center text-[10px]">
                {nom.replace(/Icon$/, "")}
              </span>
            </button>
          ))}
        </div>

        {iconesFiltrees.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucune icône trouvée.
          </p>
        )}

        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded text-sm !bg-primary !text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!iconeSelectionnee}
            onClick={() => {
              if (iconeSelectionnee) {
                onValider(iconeSelectionnee);
                reinitialiser();
                onOpenChange(false);
              }
            }}
            type="button"
          >
            Insérer
          </button>
        </div>
      </div>
    </Modale>
  );
};
