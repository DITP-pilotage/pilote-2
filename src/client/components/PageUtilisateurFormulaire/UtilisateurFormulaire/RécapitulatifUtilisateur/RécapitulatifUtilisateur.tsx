import { useFormContext } from 'react-hook-form';

export default function RécapitulatifUtilisateur() {
  const { getValues } = useFormContext();
  const t = getValues();
  return (
    <div>
      {JSON.stringify(t)}
    </div>
  );
}
