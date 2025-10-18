import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { OrganizationProvider } from '@/context/OrganizationContext';

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
              <SidebarProvider>{children}</SidebarProvider>
            </OrganizationProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
