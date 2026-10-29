import { useState } from "react";

export const useNow = (): Date => {
  const [now] = useState(() => new Date());
  return now;
};
