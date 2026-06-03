import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Header } from "@/components/layout/header";
import { Sidebar, type SidebarProjectData } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BadgeNotification } from "@/components/gamification/badge-notification";
import { Toaster } from "@/components/ui/sonner";
import { getAllProjects } from "@/lib/content";
import { projects as projectDisplayData } from "@/lib/projects";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Godot Learning Platform",
    template: "%s — Godot Learning",
  },
  description:
    "Единственный русскоязычный курс по Godot Engine с переходом от GDScript к C++. Научись создавать игры от кликера до 3D приключения.",
  keywords: [
    "Godot", "Godot Engine", "GDScript", "C++", "GDExtension",
    "геймдев", "разработка игр", "курс Godot", "обучение Godot",
    "game development", "учебный курс", "программирование игр",
  ],
  authors: [{ name: "Godot Learning Platform" }],
  creator: "Godot Learning Platform",
  publisher: "Godot Learning Platform",
  metadataBase: new URL("https://godot-learning.space-z.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Godot Learning Platform",
    title: "Godot Learning Platform",
    description:
      "Единственный русскоязычный курс по Godot Engine с переходом от GDScript к C++. Научись создавать игры от кликера до 3D приключения.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Godot Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Godot Learning Platform",
    description:
      "Единственный русскоязычный курс по Godot Engine с переходом от GDScript к C++.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#478CBF",
};

/**
 * Build sidebar data from _meta.json (server-side, single source of truth).
 * Merges chapter lists from content system with display metadata from projects.ts.
 */
function buildSidebarData(): SidebarProjectData[] {
  const contentProjects = getAllProjects();
  return projectDisplayData.map((display) => {
    const contentProject = contentProjects.find(
      (cp) => cp.projectSlug === display.slug
    );
    return {
      slug: display.slug,
      title: display.title,
      icon: display.icon,
      chapters: contentProject
        ? contentProject.chapters
            .sort((a, b) => a.order - b.order)
            .map((ch) => ({ slug: ch.slug, title: ch.title }))
        : [],
    };
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarData = buildSidebarData();

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar projects={sidebarData} />
              <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {children}
              </main>
            </div>
            <Footer />
            <MobileBottomNav />
            <BadgeNotification />
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
