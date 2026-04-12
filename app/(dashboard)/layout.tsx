import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PeriodProvider } from '@/lib/contexts/PeriodContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <PeriodProvider>
      <Sidebar />
      <Header />
      <main className="ml-56 pt-14 min-h-screen">
        {children}
      </main>
    </PeriodProvider>
  )
}
