import { createColumnHelper } from '@tanstack/react-table';
import { territoiresComparésTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { IndicateurMétriques } from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { IndicateurDonnéesParTerritoire } from './Indicateurs.interface';
import ValeurEtDate from './Bloc/ValeurEtDate/ValeurEtDate';

export default function useIndicateurs(indicateurMétriques: Record<CodeInsee, IndicateurMétriques>) {
  const territoiresComparés = territoiresComparésTerritoiresStore();

  const indicateurDonnéesParTerritoires: IndicateurDonnéesParTerritoire[] = territoiresComparés.map(territoire => ({ territoire: territoire.nom, données: indicateurMétriques[territoire.codeInsee] }));
  
  const reactTableColonnesHelper = createColumnHelper<IndicateurDonnéesParTerritoire>();
  const colonnes = [
    reactTableColonnesHelper.accessor( 'territoire', {
      header: 'Territoire(s)',
      cell: nomDuTerritoire => nomDuTerritoire.getValue(),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurInitiale', {
      header: 'Valeur initiale',
      cell: valeurInitiale => (
        <ValeurEtDate
          date={valeurInitiale.row.original.données.dateValeurInitiale}
          valeur={valeurInitiale.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurActuelle', {
      header: 'Valeur actuelle',
      cell: valeurActuelle => (
        <ValeurEtDate
          date={valeurActuelle.row.original.données.dateValeurInitiale}
          valeur={valeurActuelle.getValue()}
        />
      ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.valeurCible', {
      header: 'Valeur cible',
      cell: valeurCible => ( <ValeurEtDate valeur={valeurCible.getValue()} /> ),
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor('données.avancement.global', {
      header: 'Taux avancement global',
      cell: avancementGlobal => (
        <>
          {avancementGlobal.getValue() === null ? '- %' : `${avancementGlobal.getValue()!.toFixed(0)}%`}
          <BarreDeProgression
            afficherTexte={false}
            fond='bleu'
            taille='moyenne'
            valeur={avancementGlobal.getValue()}
            variante='primaire'
          />
        </>
      ),
      enableSorting: false, 
    }),
  ];

  return { 
    indicateurDonnéesParTerritoires, 
    colonnes, 
  };
}
