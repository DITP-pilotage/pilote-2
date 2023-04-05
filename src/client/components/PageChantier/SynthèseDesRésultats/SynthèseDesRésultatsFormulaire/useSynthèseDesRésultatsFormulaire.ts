import router from 'next/router';
import { useCallback, FormEvent, useState, useMemo } from 'react';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { récupérerUnCookie } from '@/client/utils/cookies';
import { Météo } from '@/server/domain/météo/Météo.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import SynthèseDesRésultatsFormulaireProps from './SynthèseDesRésultatsFormulaire.interface';

export default function useSynthèseDesRésultatsFormulaire(
  limiteDeCaractères: SynthèseDesRésultatsFormulaireProps['limiteDeCaractères'], 
  synthèseDesRésultatsCrééeCallback: SynthèseDesRésultatsFormulaireProps['synthèseDesRésultatsCrééeCallback'], 
  contenu: string, 
  météo: Météo,
) {
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const mailleSélectionnée = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const chantierId = router.query.id as string;
  const maille = mailleSélectionnée;
  const codeInsee = territoireSélectionné.codeInsee;
  
  const mutationCréerSynthèseDesRésultats = api.synthèseDesRésultats.créer.useMutation({
    onSuccess: (synthèseDesRésultatsCréée: SynthèseDesRésultats) => synthèseDesRésultatsCrééeCallback(synthèseDesRésultatsCréée),
    onError: (error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setAlerte({
          type: 'erreur',
          message: 'Une erreur est survenue, veuillez réessayer ultérieurement.',
        });
      }
    },
  });

  const créerSynthèseDesRésultats = (synthèseDesRésultatsÀCréer: { contenu: string, météo: Météo }) => {
    const csrf = récupérerUnCookie('csrf') ?? '';

    mutationCréerSynthèseDesRésultats.mutate({
      contenu: synthèseDesRésultatsÀCréer.contenu,
      météo: synthèseDesRésultatsÀCréer.météo,
      maille,
      codeInsee,
      chantierId,
      csrf,
    });
  };

  const contenuADépasséLaLimiteDeCaractères = useMemo(() => contenu.length > limiteDeCaractères, [contenu.length, limiteDeCaractères]);

  const saisieContenuEstInvalide = useCallback(() => {
    return contenu.length === 0 || contenuADépasséLaLimiteDeCaractères;
  }, [contenu.length, contenuADépasséLaLimiteDeCaractères]);

  const saisieMétéoEstInvalide = useCallback(() => {
    return météo === 'NON_RENSEIGNEE';
  }, [météo]);

  const formulaireEstInvalide = useCallback(() => {
    return saisieContenuEstInvalide() || saisieMétéoEstInvalide();
  }, [saisieContenuEstInvalide, saisieMétéoEstInvalide]);

  const soumettreLeFormulaire = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formulaireEstInvalide()) {
      return;
    }

    créerSynthèseDesRésultats({ contenu, météo });
  };

  return {
    alerte,
    formulaireEstInvalide,
    contenuADépasséLaLimiteDeCaractères,
    soumettreLeFormulaire,
  };
}
