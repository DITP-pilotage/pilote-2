import { parseAsString, useQueryState } from "nuqs";

export const useTerritoiresCompares = () => {
  return useQueryState(
    "territoiresCompares",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );
};
