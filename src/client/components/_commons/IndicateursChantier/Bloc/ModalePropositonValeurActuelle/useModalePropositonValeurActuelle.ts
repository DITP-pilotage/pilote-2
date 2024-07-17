import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import type { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { validationPropositionValeurActuelle } from '@/validation/proposition-valeur-actuelle';

interface PropositionValeurActuelleForm {
  valeurActuelle: number
}

const useModalePropositonValeurActuelle = ({ detailIndicateur }: {
  indicateur: Indicateur,
  detailIndicateur: DétailsIndicateur
}) => {

  return useForm<PropositionValeurActuelleForm>({
    resolver: zodResolver(validationPropositionValeurActuelle),
    defaultValues: {
      valeurActuelle: detailIndicateur.valeurActuelle || 0,
    },
  });
};

export default useModalePropositonValeurActuelle;
