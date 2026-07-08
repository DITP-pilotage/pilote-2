import { useFormContext } from 'react-hook-form'

import { type IndicateurFormValues } from '@/components/indicateurs/indicateurFormSchema'

// Surcouche typée de `useFormContext` : les sous-composants du formulaire
// indicateur (référentiels, responsables) récupèrent le form correctement typé
// depuis le `FormProvider` sans qu'on ait à leur passer `control` en props.
export const useIndicateurFormContext = () => useFormContext<IndicateurFormValues>()
