import React,{createContext,useContext,useMemo,useState} from 'react';
import {light,dark} from '../theme/tokens';
const ThemeContext=createContext(null);
export function ThemeProvider({children}){const [isDark,setIsDark]=useState(false);const value=useMemo(()=>({theme:isDark?dark:light,isDark,toggleTheme:()=>setIsDark(v=>!v)}),[isDark]);return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>}
export const useTheme=()=>useContext(ThemeContext);
