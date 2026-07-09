import { useFormContext } from 'react-hook-form'

import { type IndicateurFormValues } from '@/components/indicateurs/indicateurFormSchema'

export const useIndicateurFormContext = () => useFormContext<IndicateurFormValues>()
