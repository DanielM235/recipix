import React from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
