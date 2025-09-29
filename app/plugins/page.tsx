"use client"

import React from 'react'
import PageLayout from '../../components/layout/PageLayout'
import PluginManager from '../../components/plugins/PluginManager'
import { Settings } from 'lucide-react'

export default function PluginsPage() {
  return (
    <PageLayout
      title="Plugin Manager"
      subtitle="Manage and configure your Manifold plugins"
      icon={Settings}
    >
      <PluginManager />
    </PageLayout>
  )
}
