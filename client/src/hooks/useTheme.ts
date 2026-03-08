import { useState, useCallback, useEffect } from 'react';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
   const stored = localStorage.getItem('scriba-theme');
   if (stored === 'light' || stored === 'dark') return stored;
   return 'dark';
}

export function useTheme() {
   const [theme, setThemeState] = useState<Theme>(getInitialTheme);

   useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('scriba-theme', theme);
   }, [theme]);

   const toggleTheme = useCallback(() => {
      setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
   }, []);

   return { theme, toggleTheme };
}
