import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Upload, History, Settings } from 'lucide-react'

function Sidebar() {
  const { t } = useTranslation()

  const navigation = [
    {
      name: t('navigation.home'),
      href: '/',
      icon: Home,
    },
    {
      name: t('navigation.upload'),
      href: '/upload',
      icon: Upload,
    },
    {
      name: t('navigation.history'),
      href: '/history',
      icon: History,
    },
    {
      name: t('navigation.settings'),
      href: '/settings',
      icon: Settings,
    },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header space for navbar */}
        <div className="h-16"></div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('app.title')} v1.0.0
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
