"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
} from "react";
import { produce } from "immer";

export type AppState = {
  lastToast: { message: string; tone?: "neutral" | "success" | "error" } | null;
};

export type AppAction =
  | { type: "toast"; message: string; tone?: "neutral" | "success" | "error" }
  | { type: "toast/clear" };

const initialState: AppState = {
  lastToast: null,
};

function reducer(state: AppState, action: AppAction) {
  return produce(state, (draft) => {
    switch (action.type) {
      case "toast":
        draft.lastToast = {
          message: action.message,
          tone: action.tone ?? "neutral",
        };
        return;
      case "toast/clear":
        draft.lastToast = null;
        return;
      default: {
        const _exhaustive: never = action;
        return _exhaustive;
      }
    }
  });
}

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<Dispatch<AppAction> | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const stateValue = useMemo(() => state, [state]);

  return (
    <AppStateContext.Provider value={stateValue}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (!ctx)
    throw new Error("useAppDispatch must be used within AppStateProvider");
  return ctx;
}
