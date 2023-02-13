import React from 'react';
import départements from '@/client/constants/départements';
import régions from '@/client/constants/régions';
import AppContextType from '@/client/contexts/AppContext/AppContext.interface';

export const defaultValue = {
  départements: départements,
  régions: régions,
};

const AppContext = React.createContext<AppContextType>(defaultValue);

export default AppContext;
