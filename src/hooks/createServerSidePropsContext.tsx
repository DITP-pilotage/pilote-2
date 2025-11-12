import { createContext, PropsWithChildren, useContext } from "react";

export function createServerSidePropsContext<T>() {
  const context = createContext<T | null>(null);

  const useServerSidePropsContext = () => {
    const contextValues = useContext(context);

    if (!contextValues) {
      throw new Error(
        "useServerSidePropsContext must be used within the context!",
      );
    }

    return contextValues;
  };

  const ServerSidePropsProvider = ({
    children,
    value,
  }: PropsWithChildren<{ value: T }>) => {
    return <context.Provider value={value}>{children}</context.Provider>;
  };

  return {
    useServerSidePropsContext,
    ServerSidePropsProvider,
  };
}
