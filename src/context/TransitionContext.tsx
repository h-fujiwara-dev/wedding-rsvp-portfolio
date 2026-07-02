"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type TransitionStatus = "idle" | "covering" | "revealing";

interface TransitionContextValue {
  status: TransitionStatus;
  navigate: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  status: "idle",
  navigate: () => {},
});

const COVER_MS = 900;
const REVEAL_DELAY_MS = 500;
const REVEAL_MS = 750;

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<TransitionStatus>("idle");
  const router = useRouter();
  const navigatingRef = useRef(false);

  const navigate = useCallback(
    (href: string) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      setStatus("covering");

      setTimeout(() => {
        router.push(href);

        setTimeout(() => {
          setStatus("revealing");

          setTimeout(() => {
            setStatus("idle");
            navigatingRef.current = false;
          }, REVEAL_MS);
        }, REVEAL_DELAY_MS);
      }, COVER_MS);
    },
    [router]
  );

  return (
    <TransitionContext.Provider value={{ status, navigate }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  return useContext(TransitionContext);
}
