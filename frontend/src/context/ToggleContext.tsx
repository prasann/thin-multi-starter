import React, { createContext, useState, useContext } from 'react';

interface ToggleContextType {
  toggleState: boolean;
  setToggleState: (state: boolean) => void;
}

const defaultToggleContext: ToggleContextType = {
  toggleState: false,
  setToggleState: () => {},
};

export const ToggleContext = createContext<ToggleContextType>(defaultToggleContext);

export const ToggleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toggleState, setToggleState] = useState(true);

  return (
    <ToggleContext.Provider value={{ toggleState, setToggleState }}>
      {children}
    </ToggleContext.Provider>
  );
};

export const useToggle = () => useContext(ToggleContext);
