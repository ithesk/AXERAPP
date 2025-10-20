import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { ToastProvider } from '@/context/ToastContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <UserProvider>
            <OrganizationProvider>
              <ToastProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </ToastProvider>
            </OrganizationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
