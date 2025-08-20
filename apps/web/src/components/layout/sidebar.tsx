"use client"

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
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
    id: 'admin',
    label: 'Administração',
    icon: Settings,
    children: [
      { id: 'planos', label: 'Planos', icon: Package, href: '/admin/planos' },
      { id: 'empresas', label: 'Empresas', icon: Users, href: '/admin/companies' },
      { id: 'usuarios-sistema', label: 'Usuários do Sistema', icon: Users, href: '/admin/users' },
    ]
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
  const { user } = useAuth()

  // Filtrar menus baseado no role do usuário
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      // Seção de Administração só para superadmin
      if (item.id === 'admin' && user?.role !== 'superadmin') {
        return false
      }
      return true
    })
  }, [user?.role])

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
        {filteredMenuItems.map((item) => (
          <div key={item.id}>
            {item.children ? (
              // Menu com submenu
              <div>
                {isCollapsed ? (
                  // Quando colapsado, apenas o ícone
                  <Button
                    variant="ghost"
                    className="w-full justify-center p-2"
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
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
                                "bg-secondary/10 text-secondary border-r-2 border-secondary"
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
                    "bg-secondary/10 text-secondary border-r-2 border-secondary"
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
  )
}