import create from 'zustand';
import { ChantierState } from './ChantierStore.interface';

const useChantierStore = create<ChantierState>(set => ({
  chantiers: [],
  setChantiers: chantiers => set({ chantiers }),
}));

export default useChantierStore;