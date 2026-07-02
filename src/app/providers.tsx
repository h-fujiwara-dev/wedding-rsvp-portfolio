"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { Preloader } from "@/components/Preloader";
import { LangProvider } from "@/context/LangContext";
import { TransitionProvider, usePageTransition } from "@/context/TransitionContext";
import { PageCurtain } from "@/components/PageCurtain";
import { LenisContext } from "@/context/LenisContext";
import { ParticlesBackground } from "@/components/ParticlesBackground";

function PostHogPageView() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);
  return null;
}

function LenisScroll({
  children,
  preloaderDone,
}: {
  children: React.ReactNode;
  preloaderDone: boolean;
}) {
  const pathname = usePathname();
  const { status } = usePageTransition();
  const isLocked = status !== "idle" || !preloaderDone;
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const l = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenisRef.current = l;
    setLenis(l);

    let frameId: number;
    const raf = (time: number) => {
      l.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      l.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  const scrollToHash = useCallback(() => {
    const hash = window.location.hash;
    const target = hash ? document.querySelector<HTMLElement>(hash) : null;
    lenisRef.current?.scrollTo(target ?? 0, { immediate: true });
  }, []);

  useEffect(() => {
    scrollToHash();
  }, [pathname, scrollToHash]);

  // カーテンが完全に開く(status === "idle")、かつ初回ロード時の Preloader が
  // 完全に消える(preloaderDone === true)までスクロールを止める。
  // 途中でスクロールできてしまうと動画のスクロール連動アニメーションがズレるため。
  // Lenis.stop()はwheel/touchしか防げず、overflow:hiddenもCDP等のsynthetic scrollを防げないため、
  // body を position:fixed で固定して物理的にスクロール不能にする(body-scroll-lock方式)。
  //
  // 依存配列は生の status ではなく isLocked (bool) にすること。status は
  // "covering"→"revealing" のように非idle同士でも変化するため、生の status を
  // 使うとその遷移のたびにこの effect が再実行されてしまう。position:fixed の間は
  // window.scrollY が常に 0 を返すため、再実行のたびに正しいオフセットが誤って
  // -0px で上書きされていた(= ロック中に一瞬だけ元の位置がリセットされるバグ)。
  useEffect(() => {
    if (isLocked) {
      const y = window.scrollY;
      lenisRef.current?.stop();
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      lenisRef.current?.start();
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      scrollToHash();
      // ロック解除でレイアウトが変わりうるため、resize を監視している
      // 各動画スクローラーの境界値(minScrollRef 等)を確実に再計算させる。
      window.dispatchEvent(new Event("resize"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked]);

  // ロック中に pathname が変わった場合(router.push がカーテンでまだ完全に覆われて
  // いる間に発火した場合)、上の effect が焼き付けたオフセットは「遷移前のページ」
  // のものになってしまう。そのまま reveal を迎えると、新しいページが古いスクロール
  // 位置に固定されたまま一瞬表示される。カーテンは下から上へめくれて消える演出のため、
  // この不整合は画面の下部から見え始め、めくれている間(=ロック中)はスクロールも
  // 効かない — 「画面の下部で、途中からスクロールできなくなる」の原因。
  // カーテンはまだ完全に不透明なので、ここで一瞬だけ固定を解いて新しいページ本来の
  // 位置(またはハッシュ先)へ飛び、そこで固定し直す。Lenis は stop 中で scrollTo が
  // 効かないため、素の window.scrollTo を使う。
  useEffect(() => {
    if (!isLocked) return;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    const hash = window.location.hash;
    const target = hash ? document.querySelector<HTMLElement>(hash) : null;
    window.scrollTo(0, target ? target.getBoundingClientRect().top + window.scrollY : 0);
    const y = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [preloaderDone, setPreloaderDone] = useState(false);

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    });
  }, []);

  return (
    <TransitionProvider>
      <LangProvider>
        <PHProvider client={posthog}>
          <LenisScroll preloaderDone={preloaderDone}>
            <PostHogPageView />
            <ParticlesBackground />
            <Preloader onDone={() => setPreloaderDone(true)} />
            <PageCurtain />
            {children}
          </LenisScroll>
        </PHProvider>
      </LangProvider>
    </TransitionProvider>
  );
}
