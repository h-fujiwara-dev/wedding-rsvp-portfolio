import type { Metadata } from "next";
import {
  Geist,
  Lora,
  Playfair_Display,
  Cinzel,
  Noto_Sans_JP,
  Noto_Serif_JP,
  Shippori_Mincho_B1,
} from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Engraved Roman capitals — used for the K&S monogram and the couple's
// names, distinct from Playfair's italic (reserved for ampersands/quotes)
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Japanese glyph fallbacks for the ja locale — Playfair/Lora/Geist only cover
// latin, so without these, Japanese copy silently drops to the OS default
// font and breaks the site's editorial voice. These "_JP" families ship their
// Japanese glyphs unconditionally (Google doesn't offer a CJK "subsets" toggle
// for them — "subsets" here only adds latin/cyrillic/vietnamese extras, which
// we don't need since Playfair/Lora already own latin rendering), and Google's
// CJK delivery is unicode-range chunked, so id/en visitors never fetch them.
const shipporiMincho = Shippori_Mincho_B1({
  variable: "--font-shippori-mincho",
  weight: ["400", "500", "600", "700", "800"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["400", "500", "600", "700"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Wedding Invitation",
  description: "Kenji & Sarah — Wedding Invitation & RSVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} ${lora.variable} ${cinzel.variable} ${shipporiMincho.variable} ${notoSerifJP.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
