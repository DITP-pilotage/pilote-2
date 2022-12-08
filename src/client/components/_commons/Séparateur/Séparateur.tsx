import SéparateurProps from '@/components/_commons/Séparateur/Séparateur.interface';

export default function Séparateur({ classNamePersonnalisée = '' } : SéparateurProps) {
  return (
    <hr className={`fr-hr ${classNamePersonnalisée}`} />
  );
}
