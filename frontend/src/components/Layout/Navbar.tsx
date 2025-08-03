import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, X, Sun, Moon, Globe } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

function Navbar() {
  const { t, i18n } = useTranslation()
  const { setTheme, isDark } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt-BR' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <nav className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <h1 className='text-xl font-bold text-primary-600 dark:text-primary-400'>
                {t('app.title')}
              </h1>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className='hidden md:flex items-center space-x-4'>
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className='p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              title={t('settings.language.title') ?? ''}
            >
              <Globe className='h-5 w-5' />
              <span className='ml-1 text-sm'>{i18n.language === 'en' ? 'PT' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className='p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              title={t('settings.theme.title') ?? ''}
            >
              {isDark ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            >
              {isMobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden border-t border-gray-200 dark:border-gray-700'>
          <div className='px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800'>
            <button
              onClick={toggleLanguage}
              className='flex items-center w-full px-3 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors'
            >
              <Globe className='h-5 w-5 mr-3' />
              {t('settings.language.title')} ({i18n.language === 'en' ? 'PT' : 'EN'})
            </button>

            <button
              onClick={toggleTheme}
              className='flex items-center w-full px-3 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors'
            >
              {isDark ? <Sun className='h-5 w-5 mr-3' /> : <Moon className='h-5 w-5 mr-3' />}
              {t('settings.theme.title')}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
