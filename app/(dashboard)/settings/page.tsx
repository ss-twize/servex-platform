'use client'

import { useState } from 'react'
import { SalonTab } from '@/components/settings/tabs/SalonTab'
import { IntegrationsTab } from '@/components/settings/tabs/IntegrationsTab'
import { SegmentationTab } from '@/components/settings/tabs/SegmentationTab'
import { AgentTab } from '@/components/settings/tabs/AgentTab'
import { SystemsTab } from '@/components/settings/tabs/SystemsTab'
import { KnowledgeTab } from '@/components/settings/tabs/KnowledgeTab'

const TABS = [
  { id: 'salon', label: 'Салон' },
  { id: 'integrations', label: 'Интеграции' },
  { id: 'segmentation', label: 'Сегментация' },
  { id: 'agent', label: 'Агент' },
  { id: 'systems', label: 'Автосистемы' },
  { id: 'knowledge', label: 'База знаний' },
] as const

type TabId = (typeof TABS)[number]['id']

function TabContent({ activeTab }: { activeTab: TabId }) {
  switch (activeTab) {
    case 'salon':
      return <SalonTab />
    case 'integrations':
      return <IntegrationsTab />
    case 'segmentation':
      return <SegmentationTab />
    case 'agent':
      return <AgentTab />
    case 'systems':
      return <SystemsTab />
    case 'knowledge':
      return <KnowledgeTab />
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('salon')

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-[#EDF2FA] mb-6">Настройка</h1>

      {/* Tab navigation */}
      <div className="flex gap-0 border-b border-[#223444] mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                'border-b-2 -mb-px',
                isActive
                  ? 'border-[#00FF00] text-white'
                  : 'border-transparent text-[#5E7488] hover:text-white',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <TabContent activeTab={activeTab} />
    </div>
  )
}
