import { useState } from "react";
import { toast } from "sonner";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import { genererContenuCsv, telechargerCsv } from "@/client/utils/csv";

export const useExportCsv = (
  nomFichier: string,
  territoireCode: string,
  construireLignes: (territoiresPourExport: string[]) => Promise<string[][]>,
) => {
  const [enCours, setEnCours] = useState(false);
  const [territoiresCompares] = useTerritoiresCompares();

  const handleClick = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      const territoiresPourExport = [
        territoireCode,
        ...territoiresCompares.split(",").filter(Boolean),
      ].filter((code, index, self) => self.indexOf(code) === index);

      const lignes = await construireLignes(territoiresPourExport);
      telechargerCsv(genererContenuCsv(lignes), nomFichier);
    } catch {
      toast.error("L'export CSV a échoué, veuillez réessayer");
    } finally {
      setEnCours(false);
    }
  };

  return { enCours, handleClick };
};
