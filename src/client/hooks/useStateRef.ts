import { useState, useRef, useEffect } from 'react';

export default function useStateRef<T>(valeurInitiale: T) {
  // eslint-disable-next-line react/hook-use-state
  const [valeur, _setValeur] = useState(valeurInitiale);

  const ref = useRef(valeur);

  const setValeur = (v: T) => {
    ref.current = v;
    _setValeur(v);
  };

  useEffect(() => {
    ref.current = valeur;
  }, [valeur]);

  return [valeur, setValeur, ref] as const;
}
