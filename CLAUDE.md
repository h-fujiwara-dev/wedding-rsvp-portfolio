# CLAUDE.md — Wedding RSVP Project 開発憲法

## Project Overview
結婚式の招待状（出欠・アレルギー確認）Webページ。エンジニアとしての技術スタックを証明するポートフォリオも兼ねる。

---

## Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI Primitives
- **Icons**: Lucide React
- **Animation**: anime.js / Motion (Framer Motion)
- **Scroll**: Lenis (スムーススクロール)
- **UI Enhancements**: Magic UI / React Bits

---

## SaaS Integrations
| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL DB（RSVPデータ永続化）＋ Storage（静的アセット） |
| Resend | トランザクションメール（確認メール送信） |
| PostHog | セッション録画・行動分析 |
| Sentry | リアルタイムエラー監視 |
| Upstash Redis | RSVP APIエンドポイントのレートリミット |
| Vercel | ホスティング（Hobby プラン） |

---

## Couple Names
- **Groom**: KENJI
- **Bride**: Sarah
- **Monogram**: K&S (logo and footer use `K&S`)
- **Target audience**: Indonesian guests → default language is Bahasa Indonesia

---

## i18n (Internationalization)

### Architecture
- React Context (`src/context/LangContext.tsx`) — no URL-based routing, no `/id/` prefixes
- Translation file: `src/lib/i18n.ts` — flat objects keyed by locale (`id` / `en` / `ja`)
- Hook: `useLang()` → returns `{ locale, setLocale, t }`
- Fallback chain: `translations[locale][key] ?? translations["en"][key] ?? key`

### Locale settings
| Key | Value |
|-----|-------|
| Default locale | `"id"` (Bahasa Indonesia) |
| Available locales | `"id"` \| `"en"` \| `"ja"` |
| localStorage key | `"wedding-lang"` |

### Language switcher
- Location: `src/components/LanguageSwitcher.tsx`, rendered in `Header.tsx`
- Button order: ID → EN → JA
- Active locale: gold (`text-wedding-gold`); inactive: dim cream

### Key translation keys
- `nav.*`: BERANDA / HOME / ホーム etc.
- `form.*`: all RSVP form labels, placeholders, submit/success/error messages
- `cd.*`: countdown unit labels (hari/jam/menit/detik etc.)
- `story.*`, `det.*`, `tl.e1.*`–`tl.e5.*`: page-specific content

### Adding new text
Always add all 3 locale entries (`id`, `en`, `ja`) to `src/lib/i18n.ts` before using `t()` in components.

---

## Critical Architecture Rules

### 1. Registry は完全除外
Registry 機能はいかなる形でも実装しない。コード・UI・ルーティングすべて対象外。

### 2. RSVP はトップページインライン配置
- `/rsvp` ルート（別ページ）は作らない
- `src/app/page.tsx` の下部にインライン RSVPセクションとして配置
- RSVP Panel クリック → 同ページ内 `#rsvp` セクションへスムーススクロール

### 3. ナビゲーションは3パネル構成
Figma の4パネル（OUR STORY / THE DETAILS / REGISTRY / RSVP）から REGISTRY を除いた3パネル:
- **OUR STORY** → `src/app/story/page.tsx` へ遷移
- **THE DETAILS** → `src/app/details/page.tsx` へ遷移
- **RSVP** → 同ページ `#rsvp` セクションへスクロール

---

## RSVP Form Schema（全10項目・厳守）
`src/components/RsvpForm.tsx` および Supabase テーブルで使用するフィールド:

| # | フィールド名 | 型 | 内容 |
|---|------------|-----|------|
| 1 | `attend_or_absent` | enum | 出欠: Attend / Absent |
| 2 | `number_of_participants` | number | 参加人数 |
| 3 | `name` | string | 氏名 |
| 4 | `email_address` | string | メールアドレス |
| 5 | `age` | number | 年齢 |
| 6 | `postcode` | string | 郵便番号 |
| 7 | `address` | string | 住所 |
| 8 | `phone_number` | string | 電話番号 |
| 9 | `dietary_restrictions` | string | アレルギー・食事制限 |
| 10 | `message` | string | お祝いメッセージ |

---

## Admin Dashboard (`src/app/admin/page.tsx`)
- 上記10項目すべてを一覧表示
- Recharts を用いた集計グラフ（参加/欠席比率、参加人数分布など）
- 新郎新婦専用（認証ガード推奨）

---

## Directory Structure
```
wedding-rsvp/
├── docs/blueprint.md
├── CLAUDE.md                      ← このファイル
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Lenis / PostHog / Sentry グローバル組み込み
│   │   ├── page.tsx               # メインランディング + RSVPフォームセクション
│   │   ├── story/page.tsx         # 二人の紹介ページ（TimelineBeam）
│   │   ├── details/page.tsx       # パーティ詳細ページ
│   │   └── admin/page.tsx         # 新郎新婦専用ダッシュボード
│   ├── components/
│   │   ├── ui/                    # shadcn/ui コンポーネント群
│   │   ├── VideoScroller.tsx      # anime.js スクロール連動動画
│   │   ├── TimelineBeam.tsx       # Magic UI Animated Beam
│   │   └── RsvpForm.tsx           # 10項目 Radix UI + Motion フォーム
│   └── lib/
│       ├── supabase.ts            # Supabase クライアント初期化
│       └── upstash.ts             # Upstash Redis レートリミット
└── .env.local                     # APIキー・環境変数（gitignore済み）
```

---

## Coding Conventions
- コメントは「なぜ（WHY）」が非自明な場合のみ記載。「何をしているか（WHAT）」の説明コメントは書かない
- 不要な abstraction を避ける。3つの類似行 > 早すぎる抽象化
- エラーハンドリングは実際に起こりうる境界（ユーザー入力・外部API）のみに限定
- Feature flag・後方互換 shim は不要
- `src/` ディレクトリ内のみコードを書く（ルートにアプリコードを置かない）
- 環境変数は必ず `.env.local` で管理し、ハードコード禁止
