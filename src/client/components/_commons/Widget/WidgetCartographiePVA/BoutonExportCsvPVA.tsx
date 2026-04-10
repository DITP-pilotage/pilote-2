import { useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { Table2Icon } from "@/components/_commons/Icones/Table2Icon";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { genererContenuCsv, telechargerCsv } from "@/client/utils/csv";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonExportCsvPVA = ({
  chantierId,
  jalon,
  nomFichier,
  territoireCode,
}: {
  chantierId: string;
  jalon: number;
  nomFichier: string;
  territoireCode: string;
}) => {
  const [enCours, setEnCours] = useState(false);
  const utils = api.useUtils();
  const [territoiresCompares] = useTerritoiresCompares();

  const handleClick = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      const territoiresPourExport = [
        territoireCode,
        ...territoiresCompares.split(",").filter(Boolean),
      ].filter((code, index, self) => self.indexOf(code) === index);

      const donnees =
        await utils.chantier.recupererPVAChantierTerritoires.fetch({
          chantierId,
          jalon,
        });

      const lignesFiltrees = donnees.filter(
        (territoire) =>
          territoire.estApplicable !== false &&
          territoiresPourExport.includes(territoire.territoireCode),
      );

      const lignes: string[][] = [
        ["Territoire", "Nombre de propositions"],
        ...lignesFiltrees.map((territoire) => [
          getLabelTerritoire(territoire.territoireCode),
          String(territoire.nombrePropositionsValeur),
        ]),
      ];

      telechargerCsv(genererContenuCsv(lignes), nomFichier);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <button
      aria-busy={enCours}
      aria-label="Exporter en CSV"
      disabled={enCours}
      onClick={handleClick}
      type="button"
    >
      <Icone className="w-4 h-4" icone={Table2Icon} />
    </button>
  );
};
