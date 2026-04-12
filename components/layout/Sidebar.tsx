'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/',             label: 'Главная',   icon: LayoutDashboard },
  { href: '/appointments', label: 'Записи',    icon: Calendar        },
  { href: '/clients',      label: 'Клиенты',   icon: Users           },
  { href: '/settings',     label: 'Настройка', icon: Settings        },
]

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <li>
      <Link
        href={href}
        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'text-white bg-[#141E2B] shadow-[inset_3px_0_0_#00FF00]'
            : 'text-[#5E7488] hover:text-[#8299B4] hover:bg-[#141E2B]/50'
        }`}
      >
        <Icon
          size={17}
          className={`flex-shrink-0 transition-colors ${
            isActive ? 'text-[#00FF00]' : 'group-hover:text-[#8299B4]'
          }`}
        />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  )
}

export default function Sidebar() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#0F1622] border-r border-[#223444] flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#223444]">
        <span className="text-[#00FF00] font-bold text-xl tracking-tight font-unbounded leading-none">
          SERVEX
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-[#223444] p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[#5E7488] hover:text-[#8299B4] hover:bg-[#141E2B]/50 transition-all duration-150 group"
        >
          <LogOut size={17} className="flex-shrink-0 group-hover:text-[#8299B4] transition-colors" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  )
}
