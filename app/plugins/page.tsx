"use client"

import React from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PluginManager from '../../components/plugins/PluginManager'
import { Settings } from 'lucide-react'

export default function PluginsPage() {
  return (
    <PageLayout
      title="Plugin Manager"
      subtitle="This section is coming soon"
      icon={Settings}
    >
      <div className="p-12 text-center">
        <p className="text-gray-600">Plugins are not available in this build.</p>
      </div>
    </PageLayout>
  )
}
