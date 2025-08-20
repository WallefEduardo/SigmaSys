'use client'

import { ThemeProvider } from '@/providers/theme-provider'
import { TRPCProvider } from '@/providers/trpc-provider'
import { Toaster } from '@/components/ui/toaster'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <TRPCProvider>
        {children}
        <Toaster />
      </TRPCProvider>
    </ThemeProvider>
  )
}