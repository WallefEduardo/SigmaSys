"use client"

import React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className={cn("flex-1 overflow-y-auto p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}