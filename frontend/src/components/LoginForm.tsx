import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

interface LoginFormProps {
  readonly onToggleMode: () => void
  readonly isRegisterMode: boolean
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isRegisterMode }) => {
  const { t } = useTranslation()
  const { login, register, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isRegisterMode) {
      if (formData.password !== formData.confirmPassword) {
        setError(t('auth.passwordMismatch'))
        return
      }
      if (formData.password.length < 6) {
        setError(t('auth.passwordTooShort'))
        return
      }
      if (!formData.name.trim()) {
        setError(t('auth.nameRequired'))
        return
      }
    }

    try {
      if (isRegisterMode) {
        await register(formData.email, formData.password, formData.name)
      } else {
        await login(formData.email, formData.password)
      }
    } catch (err: any) {
      setError(err.message || t('auth.genericError'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isRegisterMode ? t('auth.signUp') : t('auth.signIn')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isRegisterMode ? t('auth.hasAccount') : t('auth.noAccount')}
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 ml-1"
            >
              {isRegisterMode ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegisterMode && (
              <div>
                <label htmlFor="name" className="sr-only">
                  {t('auth.name')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isRegisterMode}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.name')}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email')}
              />
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {isRegisterMode && (
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required={isRegisterMode}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.loading')}
                </div>
              ) : (
                <>
                  {isRegisterMode ? t('auth.signUp') : t('auth.signIn')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginForm
