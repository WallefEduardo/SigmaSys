# 🖥️ FASE 1 - FUNDAÇÃO FRONTEND (Semanas 1-2)

## 📋 Visão Geral da Fase
Estabelecer a infraestrutura base do frontend com sistema de temas, autenticação, layout responsivo e componentes base.

---

## 🎨 PARTE 1.1: Setup Base do Frontend

### **Objetivo**: Configurar infraestrutura base do frontend Next.js

### **Pré-requisitos**:
- Projeto base já existe (Better-T-Stack)
- Node.js 18+ e pnpm configurados
- Server da Fase 1 funcionando

### **Comandos Iniciais**:
```bash
cd apps/web

# Instalar dependências específicas do frontend
pnpm add @radix-ui/react-icons lucide-react framer-motion
pnpm add next-themes clsx tailwind-merge
pnpm add @tanstack/react-query @trpc/client @trpc/react-query @trpc/next
pnpm add react-hook-form @hookform/resolvers zod
pnpm add sonner react-hot-toast
pnpm add -D @types/node
```

### **Tarefas Sequenciais**:

#### 1.1.1 - Configurar Sistema de Temas
**Arquivo**: `apps/web/src/lib/theme.ts`

```typescript
export const themeColors = {
  light: {
    primary: "#2d3748",      // Cinza escuro da imagem
    secondary: "#16a34a",    // Verde escuro que contrasta com texto branco
    accent: "#3b82f6",
    background: "#ffffff",
    foreground: "#2d3748",
    muted: "#f7fafc",
    border: "#e2e8f0",
    success: "#16a34a",
    warning: "#d69e2e",
    error: "#e53e3e",
    info: "#3182ce"
  },
  dark: {
    primary: "#ffffff",
    secondary: "#16a34a",    // Verde escuro que contrasta bem
    accent: "#63b3ed",
    background: "#1a202c",   // Cinza escuro como base
    foreground: "#ffffff",
    muted: "#2d3748",       // Cinza escuro intermediário
    border: "#4a5568",
    success: "#16a34a",
    warning: "#d69e2e",
    error: "#e53e3e",
    info: "#63b3ed"
  }
}

export const animations = {
  fast: "150ms ease",
  normal: "300ms ease",
  slow: "500ms ease",
  bounce: "600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)"
}

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem"
}

export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px"
}
```

#### 1.1.2 - Configurar Tailwind CSS
**Arquivo**: `apps/web/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### 1.1.3 - Configurar CSS Global
**Arquivo**: `apps/web/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 218 11% 22%;
    --card: 0 0% 100%;
    --card-foreground: 218 11% 22%;
    --popover: 0 0% 100%;
    --popover-foreground: 218 11% 22%;
    --primary: 218 11% 22%;
    --primary-foreground: 0 0% 98%;
    --secondary: 142 71% 45%;
    --secondary-foreground: 0 0% 98%;
    --muted: 210 14% 97%;
    --muted-foreground: 215 15% 58%;
    --accent: 213 82% 58%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 213 82% 58%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 214 32% 12%;
    --foreground: 0 0% 98%;
    --card: 214 32% 12%;
    --card-foreground: 0 0% 98%;
    --popover: 214 32% 12%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 214 32% 12%;
    --secondary: 142 71% 45%;
    --secondary-foreground: 0 0% 98%;
    --muted: 218 11% 22%;
    --muted-foreground: 217 10% 65%;
    --accent: 213 66% 74%;
    --accent-foreground: 214 32% 12%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 217 10% 42%;
    --input: 217 10% 42%;
    --ring: 213 66% 74%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Scrollbar personalizada */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-muted;
}

::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-accent;
}

/* Animações personalizadas */
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-bounce-slow {
  animation: bounce 2s infinite;
}

/* Componentes customizados */
.glass-effect {
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-effect {
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Transitions suaves */
.transition-all-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 1.1.4 - Configurar Provider de Temas
**Arquivo**: `apps/web/src/providers/theme-provider.tsx`

```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### **Critérios de Aceite**:
- [ ] Sistema de temas configurado
- [ ] CSS global aplicado
- [ ] Cores funcionando em ambos os temas

---

## 🧩 PARTE 1.2: Componentes Base shadcn/ui

### **Objetivo**: Configurar componentes base do shadcn/ui

### **Tarefas Sequenciais**:

#### 1.2.1 - Configurar shadcn/ui
```bash
# Instalar CLI do shadcn/ui
pnpx shadcn-ui@latest init

# Instalar componentes base
pnpx shadcn-ui@latest add button
pnpx shadcn-ui@latest add input
pnpx shadcn-ui@latest add label
pnpx shadcn-ui@latest add card
pnpx shadcn-ui@latest add sheet
pnpx shadcn-ui@latest add dropdown-menu
pnpx shadcn-ui@latest add avatar
pnpx shadcn-ui@latest add badge
pnpx shadcn-ui@latest add toast
pnpx shadcn-ui@latest add form
pnpx shadcn-ui@latest add select
pnpx shadcn-ui@latest add checkbox
pnpx shadcn-ui@latest add switch
pnpx shadcn-ui@latest add dialog
pnpx shadcn-ui@latest add table
pnpx shadcn-ui@latest add tabs
```

#### 1.2.2 - Utilitários CSS
**Arquivo**: `apps/web/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
```

#### 1.2.3 - Componente de Toggle de Tema
**Arquivo**: `apps/web/src/components/ui/theme-toggle.tsx`

```typescript
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### **Critérios de Aceite**:
- [ ] Componentes shadcn/ui instalados
- [ ] Toggle de tema funcionando
- [ ] Utilitários de formatação criados

---

## 🏗️ PARTE 1.3: Layout e Sidebar

### **Objetivo**: Criar layout responsivo com sidebar colapsável

### **Tarefas Sequenciais**:

#### 1.3.1 - Componente de Sidebar
**Arquivo**: `apps/web/src/components/layout/sidebar.tsx`

```typescript
"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Settings,
  MessageSquare,
  Factory,
  Truck,
  FileText,
  Calculator,
  Wrench,
  Palette,
  ChevronDown,
} from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  children?: Omit<MenuItem, 'children'>[]
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard'
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: Package,
    children: [
      { id: 'clientes', label: 'Clientes', icon: Users, href: '/cadastros/clientes' },
      { id: 'produtos', label: 'Produtos', icon: Package, href: '/cadastros/produtos' },
      { id: 'materiais', label: 'Matérias-Primas', icon: Package, href: '/cadastros/materias-primas' },
      { id: 'equipamentos', label: 'Equipamentos', icon: Wrench, href: '/cadastros/equipamentos' },
      { id: 'processos', label: 'Processos', icon: Factory, href: '/cadastros/processos' },
      { id: 'acabamentos', label: 'Acabamentos', icon: Palette, href: '/cadastros/acabamentos' },
    ]
  },
  {
    id: 'comercial',
    label: 'Comercial',
    icon: ShoppingCart,
    children: [
      { id: 'orcamentos', label: 'Orçamentos', icon: Calculator, href: '/comercial/orcamentos' },
      { id: 'ordens-servico', label: 'Ordens de Serviço', icon: FileText, href: '/comercial/ordens-servico' },
      { id: 'funil', label: 'Funil de Vendas', icon: BarChart3, href: '/comercial/funil' },
    ]
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: DollarSign,
    children: [
      { id: 'contas-receber', label: 'Contas a Receber', icon: DollarSign, href: '/financeiro/contas-receber' },
      { id: 'contas-pagar', label: 'Contas a Pagar', icon: DollarSign, href: '/financeiro/contas-pagar' },
      { id: 'plano-contas', label: 'Plano de Contas', icon: FileText, href: '/financeiro/plano-contas' },
      { id: 'ponto-equilibrio', label: 'Ponto de Equilíbrio', icon: BarChart3, href: '/financeiro/ponto-equilibrio' },
    ]
  },
  {
    id: 'producao',
    label: 'Produção',
    icon: Factory,
    children: [
      { id: 'pcp', label: 'PCP', icon: BarChart3, href: '/producao/pcp' },
      { id: 'apontamento', label: 'Apontamento', icon: FileText, href: '/producao/apontamento' },
    ]
  },
  {
    id: 'estoque',
    label: 'Estoque',
    icon: Truck,
    href: '/estoque'
  },
  {
    id: 'chat',
    label: 'Chat WhatsApp',
    icon: MessageSquare,
    href: '/chat'
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings,
    children: [
      { id: 'usuarios', label: 'Usuários', icon: Users, href: '/configuracoes/usuarios' },
      { id: 'parametros', label: 'Parâmetros', icon: Settings, href: '/configuracoes/parametros' },
    ]
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isExpanded = (itemId: string) => expandedItems.includes(itemId)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">ERP System</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.id}>
            {item.children ? (
              // Menu com submenu
              <div>
                {isCollapsed ? (
                  // Dropdown quando colapsado
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-center p-2"
                      >
                        <item.icon className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.id} asChild>
                          <Link href={child.href || '#'}>
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  // Menu expandido
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded(item.id) && "rotate-180"
                        )}
                      />
                    </Button>
                    {isExpanded(item.id) && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children.map((child) => (
                          <Button
                            key={child.id}
                            variant="ghost"
                            asChild
                            className={cn(
                              "w-full justify-start",
                              pathname === child.href &&
                                "bg-accent text-accent-foreground"
                            )}
                          >
                            <Link href={child.href || '#'}>
                              {child.label}
                            </Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Menu simples
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "w-full",
                  isCollapsed ? "justify-center p-2" : "justify-start",
                  pathname === item.href &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <Link href={item.href || '#'}>
                  <item.icon className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-2">{item.label}</span>}
                </Link>
              </Button>
            )}
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col border-r bg-background",
          isCollapsed ? "w-16" : "w-64",
          "transition-all duration-300",
          className
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
```

#### 1.3.2 - Layout Principal
**Arquivo**: `apps/web/src/components/layout/main-layout.tsx`

```typescript
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
```

#### 1.3.3 - Componente de Header
**Arquivo**: `apps/web/src/components/layout/header.tsx`

```typescript
"use client"

import React from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, LogOut, Settings, User } from 'lucide-react'

export function Header() {
  // Dados mockados do usuário
  const user = {
    name: "Administrador Teste",
    email: "admin@empresateste.com",
    avatar: null,
    company: "Empresa Teste"
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          Sistema ERP - Comunicação Visual
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Novo orçamento</p>
                <p className="text-xs text-muted-foreground">
                  Orçamento #001 criado há 5 minutos
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Conta vencendo</p>
                <p className="text-xs text-muted-foreground">
                  Conta de energia elétrica vence em 3 dias
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle de tema */}
        <ThemeToggle />

        {/* Menu do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.company}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### **Critérios de Aceite**:
- [ ] Sidebar colapsável funcionando
- [ ] Popover aparece quando sidebar está minimizada
- [ ] Header com menu de usuário funcional
- [ ] Layout responsivo para mobile

---

## 🔌 PARTE 1.4: Configuração tRPC e API

### **Objetivo**: Configurar cliente tRPC para comunicação com o backend

### **Tarefas Sequenciais**:

#### 1.4.1 - Configurar Cliente tRPC
**Arquivo**: `apps/web/src/lib/api.ts`

```typescript
import { createTRPCNext } from '@trpc/next'
import { httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../server/src/routers'

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
          headers() {
            const token = typeof window !== 'undefined' 
              ? localStorage.getItem('auth-token') 
              : null
            
            return token ? { authorization: `Bearer ${token}` } : {}
          },
        }),
      ],
    }
  },
  ssr: false,
})
```

#### 1.4.2 - Provider de API
**Arquivo**: `apps/web/src/providers/api-provider.tsx`

```typescript
"use client"

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface APIProviderProps {
  children: React.ReactNode
}

export function APIProvider({ children }: APIProviderProps) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <api.Provider client={api} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  )
}
```

#### 1.4.3 - Tipos Compartilhados
**Arquivo**: `apps/web/src/types/index.ts`

```typescript
// Tipos mockados para desenvolvimento
export interface User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  permissions?: any
}

export interface Company {
  id: string
  name: string
  cnpj?: string
  email?: string
  phone?: string
  plan: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
  type: 'person' | 'company'
  address?: string
  birthday?: Date
  segment?: string
  tags: string[]
  notes?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string
  category?: string
  formula?: any
  checklist?: any
  margin: any
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  id: string
  name: string
  description?: string
  unit: string
  cost: number
  supplier?: string
  supplierCode?: string
  minStock?: number
  category?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Mais tipos serão adicionados conforme necessário
```

### **Critérios de Aceite**:
- [ ] Cliente tRPC configurado
- [ ] Provider de API funcionando
- [ ] Tipos TypeScript definidos

---

## 🔐 PARTE 1.5: Sistema de Autenticação Frontend

### **Objetivo**: Implementar autenticação no frontend com dados reais

### **Tarefas Sequenciais**:

#### 1.5.1 - Hook de Autenticação
**Arquivo**: `apps/web/src/hooks/use-auth.ts`

```typescript
"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/types'

interface AuthState {
  user: User | null
  company: Company | null
  token: string | null
  isAuthenticated: boolean
  login: (userData: { user: User; company: Company; token: string }) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      isAuthenticated: false,

      login: ({ user, company, token }) => {
        // Salvar token no localStorage para o tRPC
        localStorage.setItem('auth-token', token)
        
        set({
          user,
          company,
          token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        // Remover token do localStorage
        localStorage.removeItem('auth-token')
        
        set({
          user: null,
          company: null,
          token: null,
          isAuthenticated: false,
        })
      },

      updateUser: (userData) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData },
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export function useAuth() {
  return useAuthStore()
}
```

#### 1.5.2 - Páginas de Autenticação
**Arquivo**: `apps/web/src/app/(auth)/login/page.tsx`

```typescript
"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      login(data)
      toast.success('Login realizado com sucesso!')
      router.push('/dashboard')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao fazer login')
    },
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sistema ERP
          </CardTitle>
          <CardDescription className="text-center">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          {/* Credenciais de teste */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Credenciais de teste:</strong>
            </p>
            <p className="text-sm">Email: admin@empresateste.com</p>
            <p className="text-sm">Senha: 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 1.5.3 - Layout de Autenticação
**Arquivo**: `apps/web/src/app/(auth)/layout.tsx`

```typescript
import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {children}
    </div>
  )
}
```

#### 1.5.4 - Middleware de Proteção de Rotas
**Arquivo**: `apps/web/src/components/auth/auth-guard.tsx`

```typescript
"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login')
    }
  }, [isAuthenticated, token, router])

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
```

### **Critérios de Aceite**:
- [ ] Login funcional com backend real
- [ ] Token salvo e enviado automaticamente
- [ ] Proteção de rotas implementada
- [ ] Logout funcional

---

## 📋 RESUMO DA FASE 1 - FRONTEND

### **O que foi implementado**:
✅ Sistema de temas Dark/Light completo  
✅ Componentes base shadcn/ui configurados  
✅ Layout responsivo com sidebar colapsável  
✅ Cliente tRPC configurado  
✅ Sistema de autenticação funcional  
✅ Proteção de rotas implementada  

### **Estrutura de Arquivos Criada**:
```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── main-layout.tsx
│   └── auth/
│       └── auth-guard.tsx
├── hooks/
│   └── use-auth.ts
├── lib/
│   ├── api.ts
│   ├── theme.ts
│   └── utils.ts
├── providers/
│   ├── theme-provider.tsx
│   └── api-provider.tsx
└── types/
    └── index.ts
```

### **Próximos Passos**:
- **FASE 2**: Implementar páginas de cadastros com dados mockados
- **FASE 3**: Criar sistema de produtos e fórmulas
- **FASE 4**: Implementar engine de precificação

### **Comandos para Testar**:
```bash
# Testar frontend
pnpm dev:web

# Testar login
# Usar: admin@empresateste.com / 123456

# Verificar temas
# Clicar no toggle de tema no header
```