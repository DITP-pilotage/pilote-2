import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataSelectionIndicateurForm = {
  indicHiddenPilote: string;
};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataSelectionIndicateurForm>) {
  watch('indicHiddenPilote');
}

export default function useSelectionIndicateurForm() {
  const {  getValues, setValue, watch } = useFormContext<MetadataSelectionIndicateurForm>();

  activerWatchSurSelecteur(watch);

  return {
    getValues,
    setValue,
  };
}
