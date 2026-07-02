"use client";

import { useLang } from "@/context/LangContext";

/** Renders a single translated string inline inside a server component. */
export function Trans({ k }: { k: string }) {
  const { t } = useLang();
  return <>{t(k)}</>;
}
