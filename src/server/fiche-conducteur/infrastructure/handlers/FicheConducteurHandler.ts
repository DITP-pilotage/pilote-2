import { FicheConducteurContrat } from '@/server/fiche-conducteur/app/contrats/FicheConducteurContrat';

export const ficheConducteurHandler = () => {
  const recupererFicheConducteur = async (territoireCode: string): Promise<FicheConducteurContrat> => {
    return {};
  };
  
  return {
    recupererFicheConducteur,
  };
};
