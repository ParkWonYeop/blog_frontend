'use client';

import { createContext, useContext } from 'react';

export const PageFocusContext = createContext<{ isFocused: boolean; setFocused: (focused: boolean) => void }>({
  isFocused: false,
  setFocused: () => {},
});

export const usePageFocus = () => useContext(PageFocusContext);
