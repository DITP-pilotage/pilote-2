import { createContext, useContext } from "react";

export const ModeExportContext = createContext(false);

export const useModeExport = () => useContext(ModeExportContext);
