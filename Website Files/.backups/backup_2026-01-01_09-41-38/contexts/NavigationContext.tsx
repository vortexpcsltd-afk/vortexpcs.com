/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface NavigationContextValue {
  currentView: string;
  navigate: (view: string) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [currentView, setCurrentView] = useState<string>("home");

  useEffect(() => {
    const path = location.pathname.replace(/^\/+/, "");
    let view = path === "" ? "home" : path;
    if (view.startsWith("admin/")) {
      view = "admin";
    }
    setCurrentView(view);
  }, [location.pathname]);

  const value: NavigationContextValue = useMemo(
    () => ({
      currentView,
      navigate: (view: string) => {
        const path = view === "home" ? "/" : `/${view}`;
        routerNavigate(path);
      },
      goBack: () => {
        routerNavigate(-1);
      },
    }),
    [currentView, routerNavigate]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx)
    throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
