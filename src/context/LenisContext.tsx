"use client";
import { createContext, useContext } from "react";
import type Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);
export { LenisContext };
export const useLenis = () => useContext(LenisContext);
