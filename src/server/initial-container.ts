import { asClass, AwilixContainer, ContainerOptions, createContainer, InjectionMode, Lifetime } from 'awilix';
import { InitialDependencies } from './dependances';
import { PrismaPilote } from './db/PrismaPilote';

export const getInitialContainer = (): AwilixContainer<InitialDependencies> => {
  const defaultOptions: ContainerOptions = { injectionMode: InjectionMode.PROXY, strict: true };
  const initialContainer = createContainer<InitialDependencies>(defaultOptions);
  
  return initialContainer.register({
    prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
  });
};
