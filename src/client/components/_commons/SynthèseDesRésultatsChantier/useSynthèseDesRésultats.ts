import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs';

export const useSynthèseDesRésultats = () => {
  const [, setAction] = useQueryState('_action', parseAsStringLiteral(['creation-reussie', '']).withDefault('').withOptions({
    history: 'push',
    shallow: false,
    clearOnDefault: true,
  }));

  const [, setModeÉdition] = useQueryState('edition', parseAsBoolean.withDefault(false).withOptions({
    history: 'push',
    shallow: false,
    clearOnDefault: true,
  }));

  const synthèseDesRésultatsCréée = () => {
    setAction('creation-reussie');
    setModeÉdition(false);
  };

  return {
    synthèseDesRésultatsCréée,
  };
};
