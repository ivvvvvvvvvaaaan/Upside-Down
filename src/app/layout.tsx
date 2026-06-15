import { ThemeProvider } from '@/hooks/useTheme'
import { BreadcrumbExtrasProvider } from '@/components/ui/project-breadcrumb'
import './globals.css'

/*
 * ===========================================
 * ROOT LAYOUT
 * ===========================================
 * Provides theme context and shared breadcrumb state.
 * All pages inherit dark/light mode from here.
 *
 * DEFAULT: Dark mode
 * - Theme is toggled from the persona dropdown in the left nav rail
 * - Preference persists in localStorage (see ThemeProvider)
 * - <html className="dark"> + suppressHydrationWarning avoids hydration mismatch
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <BreadcrumbExtrasProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </BreadcrumbExtrasProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
