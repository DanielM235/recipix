import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Save, TestTube, Check, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import apiService from '../services/api'

function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  
  // Firefly III Settings
  const [fireflyUrl, setFireflyUrl] = useState(localStorage.getItem('firefly_url') || '')
  const [fireflyToken, setFireflyToken] = useState(localStorage.getItem('firefly_token') || '')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
    toast.success(t('success.saved'))
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    toast.success(t('success.saved'))
  }

  const handleFireflySettingsSave = () => {
    localStorage.setItem('firefly_url', fireflyUrl)
    localStorage.setItem('firefly_token', fireflyToken)
    toast.success(t('success.saved'))
  }

  const handleTestConnection = async () => {
    if (!fireflyUrl || !fireflyToken) {
      toast.error('Please fill in both URL and token')
      return
    }

    setIsTestingConnection(true)
    try {
      const result = await apiService.testConnector({
        type: 'firefly',
        name: 'Firefly III',
        baseUrl: fireflyUrl,
        apiKey: fireflyToken,
        isActive: true
      })
      
      if (result.connected) {
        setConnectionStatus('connected')
        toast.success(t('success.connected'))
      } else {
        setConnectionStatus('disconnected')
        toast.error(result.message || t('errors.connectionFailed'))
      }
    } catch (error) {
      setConnectionStatus('disconnected')
      toast.error(t('errors.connectionFailed'))
    } finally {
      setIsTestingConnection(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('settings.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Configure your preferences and integrations
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('settings.language.title')}
          </h2>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="language"
                value="en"
                checked={i18n.language === 'en'}
                onChange={() => handleLanguageChange('en')}
                className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {t('settings.language.english')}
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="language"
                value="pt-BR"
                checked={i18n.language === 'pt-BR'}
                onChange={() => handleLanguageChange('pt-BR')}
                className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {t('settings.language.portuguese')}
              </span>
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('settings.theme.title')}
          </h2>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => handleThemeChange('light')}
                className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {t('settings.theme.light')}
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
                className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {t('settings.theme.dark')}
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={() => handleThemeChange('system')}
                className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {t('settings.theme.system')}
              </span>
            </label>
          </div>
        </div>

        {/* Firefly III Integration */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('settings.firefly.title')}
            </h2>
            
            {connectionStatus !== 'unknown' && (
              <div className="flex items-center">
                {connectionStatus === 'connected' ? (
                  <>
                    <Check className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {t('settings.firefly.connected')}
                    </span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {t('settings.firefly.disconnected')}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.firefly.url')}
              </label>
              <input
                type="url"
                value={fireflyUrl}
                onChange={(e) => setFireflyUrl(e.target.value)}
                placeholder="https://your-firefly-instance.com"
                className="input w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.firefly.token')}
              </label>
              <input
                type="password"
                value={fireflyToken}
                onChange={(e) => setFireflyToken(e.target.value)}
                placeholder="Your personal access token"
                className="input w-full"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleFireflySettingsSave}
                className="btn btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </button>
              
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !fireflyUrl || !fireflyToken}
                className="btn btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingConnection ? 'Testing...' : t('settings.firefly.test')}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Settings can be added here */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked={true}
                className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Auto-process receipts after upload
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked={true}
                className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Enable notifications
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
