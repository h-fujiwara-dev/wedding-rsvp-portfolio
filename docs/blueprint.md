📄 Obsidianに「丸ごと一発で」貼る用の最新仕様書（blueprint.md）
Markdown
# 💍 Project: Wedding Invitation & Portfolio Site (Master Blueprint)

## 🎯 Project Overview
- **Objective**: 結婚式の招待状（出欠・アレルギー確認）Webページの作成、および自身のエンジニアとしての技術スタックを証明するポートフォリオとしての活用
- **Media Asset Provider**: Runway (Standard Plan) ── 1ヶ月のみMonthly契約（$15）
- **Cost / Infrastructure Strategy**: Total $15。インフラ、フロントエンド、DB、周辺SaaSのすべてで完全無料枠を徹底活用し、商用レベルの「可観測性（Observability）」と「防衛」を構築する。

---

## 🎨 Page Structure & UI Requirements (Based on Figma Template)

Figmaのデザイン（Jenny & Jason テンプレートベース）から、以下の仕様変更・ルーティングを適用して開発を行う。

### 🚨 Routing & Components
1. **Top Landing Page (`src/app/page.tsx`)**
    - **Header/Hero Section**: イントロダクションおよびシネマティック動画（anime.js制御）
    - **Navigation Panels**: Figmaの4パネル構成から「REGISTRY」を削除し、3つのナビゲーション（または3パネル構成）へ再設計する。
        - **OUR STORY Panel**: クリックで紹介ページ（`src/app/story/page.tsx`）へ遷移。
        - **THE DETAILS Panel**: クリックでパーティ詳細ページ（`src/app/details/page.tsx`）へ遷移。
        - **RSVP Panel**: クリックで同トップページ内の下部に配置された「RSVPフォームセクション」へスムーズスクロール（アンカーリンク）する。
2. **RSVP Section Form Schema (`src/components/RsvpForm.tsx`)**
    Figmaテンプレートと異なり、フォームは別ページではなくトップページ内にインラインで用意。Motionを用いた多段階ステップUIで以下の全10項目を厳密に収集する。
    - `attend_or_absent` (出欠: Attend / Absent)
    - `number_of_participants` (参加人数: 数値)
    - `name` (氏名)
    - `email_address` (メールアドレス)
    - `age` (年齢)
    - `postcode` (郵便番号)
    - `address` (住所)
    - `phone_number` (電話番号)
    - `dietary_restrictions` (アレルギー・食事制限)
    - `message` (お祝いメッセージ)
3. **Registry Section**: **【完全不要・実装除外】**（Figma上の下部セクションも含む）

---

## 🏗 Directory & Architecture Blueprint

```text
my-wedding-project/
├── docs/
│   └── blueprint.md           # 本仕様書（Obsidian同期用）
├── CLAUDE.md                  # Claude Code専用のプロジェクト憲法・開発規約
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Lenis / PostHog / Sentry のグローバル組み込み
│   │   ├── page.tsx           # メインランディングページ (Figmaベースパネル、RSVPフォーム設置)
│   │   ├── story/
│   │   │   └── page.tsx       # 二人の紹介ページ (TimelineBeamをここに配置)
│   │   ├── details/
│   │   │   └── page.tsx       # パーティの詳細ページ
│   │   └── admin/
│   │       └── page.tsx       # 新郎新婦専用ダッシュボード (参加者一覧・Rechartsグラフ表示)
│   ├── components/
│   │   ├── ui/                # shadcn/ui コンポーネント群
│   │   ├── VideoScroller.tsx  # anime.jsを用いたスクロール連動動画コンポーネント
│   │   ├── TimelineBeam.tsx   # Magic UI (Animated Beam)
│   │   └── RsvpForm.tsx       # 10項目を網羅したRadix UI + Motion フォーム
│   └── lib/
│       ├── supabase.ts        # Supabase クライアント初期化
│       └── upstash.ts         # Upstash Redis によるレートリミット
└── .env.local                 # 各種APIキー・環境変数管理
🛠 Technical Stack Specification
1. Core Stack
Framework: React / Next.js (App Router, TypeScript)

Styling: Tailwind CSS + shadcn/ui

Icons & Primitives: Lucide React / Radix UI Primitives (アクセシビリティ担保)

Animation: anime.js / Motion

UI Enhancements: Lenis (スムーススクロール) / Magic UI / React Bits

**Testing**: **Playwright** (ユニットテスト/E2E/結合試験。フォームの多段階遷移、スクロール演出、ダッシュボードの描画、API疎通の自動検証)

2. Infrastructure & Advanced Production Tools (All Free Tier)
Hosting: Vercel (Hobby)

DNS: AWS Route 53

Database: Supabase (PostgreSQL)

Storage: Supabase Storage (静的アセット)

Email: Resend (React Email連携)

Analytics: PostHog (セッション録画・行動分析)

Error Tracking: Sentry (リアルタイムエラー監視)

Serverless Cache: Upstash (Redisレートリミット)

📝 Implementation Strategy (Claude Code Task List)
🟩 STEP 1: Foundation & Observability Setup (基礎と監視)
[x] Initialize Next.js project with TypeScript, Tailwind CSS, and App Router.

[x] Create CLAUDE.md to lock down development rules and naming conventions.

[x] Set up Sentry via wizard for global error tracking.

[x] Integrate PostHog provider in src/app/layout.tsx for session recording.

🎨 STEP 2: Design Language & Routing Integration (Figma MCP)
[x] Connect via Figma MCP to extract design tokens (colors, typography).

[x] Sync tokens into tailwind.config.ts and src/app/globals.css.

[x] Initialize shadcn/ui utilizing the customized Tailwind configuration.

[x] Generate the layout skeleton for routing: src/app/page.tsx, src/app/story/page.tsx, and src/app/details/page.tsx.

### 🧱 STEP 3: Core Logic & Security First
- [x] Configure **Upstash Redis** (`src/lib/upstash.ts`) for the RSVP API endpoint rate-limit.
- [x] Configure **Supabase client** (`src/lib/supabase.ts`) and create table matching the 10 RSVP fields.
- [x] Build `src/components/RsvpForm.tsx` handling the specified 10 input fields without animation.
- [x] Implement the API route for RSVP: **Upstash rate limit -> Supabase insert -> Resend template email.**
- [x] **【新規追加】** Setup **Playwright** (`npm init playwright@latest`) and write a integration test to verify the 10-field RSVP form submission endpoint and DB entry logic.
- [x] Build a private dashboard in `src/app/admin/page.tsx` to visualize RSVP entries and render Recharts charts.

### 🌟 STEP 4: High-End Motion & Generative AI
- [x] Inject `Lenis` smooth scroll wrapper into `src/app/layout.tsx`.
- [x] Implement `src/components/VideoScroller.tsx` — 200vh sticky scroll container, Ken Burns poster fallback, scroll-linked video.currentTime scrubbing via Framer Motion `useSpring`, CSS keyframe title animations (Framer Motion `animate` bypassed due to Lenis rAF conflict).
- [x] Refactor `src/components/RsvpForm.tsx` with `Motion` for fluent multi-step UX inside the top page.
- [x] **【新規追加】** Expand Playwright tests to cover UI/UX transitions (e.g., page scrolling, multi-step Motion transitions, and Recharts rendering stability).
- [x] Build `src/components/TimelineBeam.tsx` (Magic UI) inside the story page.
- [x] Performance audit and event verification across Sentry/PostHog.

### 🖼 STEP 5: Our Story Page — UI/UX Pro Max
- [x] **Supabase Storage** — Created public bucket `wedding-assets`; uploaded 6 couple photos to `our story/` folder. Updated `next.config.ts` with Supabase Storage `remotePatterns`.
- [x] **VideoScroller hero** — Cinematic 200vh scroll with sticky viewport. Poster: traditional Japanese wedding ceremony photo from Supabase Storage. Scroll-linked title fade via `useTransform`/`useSpring`. CSS keyframe entrance (`wSlideUp`, `wFadeIn`, `wScaleX`). Ken Burns zoom animation on poster image.
- [x] **StoryGallery** — 6-photo CSS masonry (columns-3). 3D tilt via `useMotionValue` + `useSpring` (rotateX/Y, scale 1.04). Soft shadow bloom on hover. CSS hover zoom (`scale(1.09)`) + date label reveal. `useScrollInView` custom hook using `window` scroll events (bypasses IntersectionObserver which is unreliable with Lenis).
- [x] **BlurFade fix** — Replaced Framer Motion `animate`+`useInView` approach with `window` scroll event listener + CSS transitions. Root cause: Lenis smooth scroll causes IntersectionObserver to miss elements during rapid scroll. New approach: `getBoundingClientRect()` checked on every `scroll` event, CSS `transition` handles visual interpolation.
- [x] **Intro text section** — Glassmorphism gradient bridge (charcoal→cream) seamlessly blends video exit into content. BlurFade-wrapped date, p1, p2 now reliably visible.
- [x] **RSVP CTA section** — Botanical corner accents, BotanicalDivider, shimmer-sweep button animation.
- [x] **i18n keys** — All Story page text (story.date, story.p1/p2, story.timelineEyebrow/H2/Sub, story.ctaP1/P2/Sub) added to all 3 locales (id/en/ja).
- [x] **VideoScroller OUR STORY 永続表示** — `useTransform` の双方向マッピング（スクロールバックで opacity が 0 に戻る問題）を根絶。`useMotionValue` + `scrollYProgress.on("change")` による一方向ロックへ完全移行。`Math.max` (opacity) / `Math.min` (y, blur) により「一度表示されたら消えない」を実装。Playwright E2E テスト 12 件で「ダウン→バック→再ダウン」のシナリオを数学的に検証済み。
- [x] **VideoScroller bottom glass フリッカー修正** — 動画下部の白グラデーション（wedding-cream）が Lenis lerp 振動で明滅する問題を根絶。`bottomGlassOpacity`（双方向 `useTransform`）を削除し、一方向 `useMotionValue(0)` + `Math.max` 更新に置換。OUR STORY と同アーキテクチャで統一。

### 🏨 STEP 6: Details Page — UI/UX Pro Max Refactoring
- [x] **STAGE 1 (分析・要件定義)** — Belviu Hotel 公式サイトのビジュアル・雰囲気（ミニマリスト高級感、ニュートラルパレット、モダンリゾート）を分析。現行ページの課題（ビジュアルゼロ、ドレスコード/宿泊セクション不在、MapsショートリンクURL未活用）を洗い出し。改善要件を `docs/details_improvement_proposal.md` に出力。
- [x] **STAGE 2 (実装)** — 6セクション構成へ全面リファクタリング:
  - **Hero**: Unsplash ホテル写真（`photo-1551882547-ff40c63fe2f5`）全面背景 + シネマティックグラデーションオーバーレイ + CSS keyframe 入場アニメーション（Lenis安全）。
  - **Venue Spotlight**: 2カラム（テキスト+写真カード）。ホテル名 italic display、3つのアメニティbullet、Google Maps ショートリンク（`maps.app.goo.gl/ji1oFLgj2zdw928X6` → モバイルでMapsアプリが開く）+ ホテルサイトリンク。日付フローティングバッジ。
  - **Event Details**: BlurFade stagger 付き2カラムグリッド（既存6項目を強化）。
  - **Tabs（スケジュール/ドレスコード/宿泊）**: `useState` 自作タブ（gold アンダーライン指示子）。ドレスコードは Shirt アイコン + カラーパレットスウォッチ6色。宿泊は4つの客室ティアカード + ホテルCTA。
  - **Access**: Dark charcoal luxury セクション。Google Maps 埋め込み（grayscale → color on hover）+ ショートリンクCTA。
  - **i18n**: 17の新規キーを全3ロケール（id/en/ja）に追加。
- [x] **STAGE 3 (QA・自律デバッグ)** — TypeScript `--noEmit` エラーゼロ確認。Next.js production build 成功（`/details` static生成）。重複クラス（`flex-shrink-0` 二重付与）を発見・自動修正。Lenis互換性: Framer Motion `useInView` 不使用、全スクロール演出は `BlurFade`（scroll-event ベース）か CSS keyframes のみ。