import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../../../shared/enums'

const Profile: React.FC = () => {
  const { t } = useTranslation()
  const { user, logout, isAdmin } = useAuth()

  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('profile.title')}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t('profile.subtitle')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {t('profile.logout')}
            </button>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('profile.name')}
                </label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2">
                  {user.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('profile.email')}
                </label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2">
                  {user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('profile.role')}
                </label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ 
                    user.role === UserRole.ADMIN 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {user.role === UserRole.ADMIN ? t('profile.roleAdmin') : t('profile.roleUser')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('profile.accountType')}
                </label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2">
                  {isAdmin ? t('profile.administratorAccount') : t('profile.standardAccount')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('profile.memberSince')}
                </label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2">
                  {user.createdAt ? formatDate(user.createdAt) : t('common.notAvailable')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('profile.permissions')}
                </label>
                <div className="mt-1 space-y-2">
                  <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2">
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t('profile.permissionUpload')}</li>
                      <li>{t('profile.permissionHistory')}</li>
                      {isAdmin && (
                        <>
                          <li className="text-purple-600 dark:text-purple-400">
                            {t('profile.permissionManageConnectors')}
                          </li>
                          <li className="text-purple-600 dark:text-purple-400">
                            {t('profile.permissionViewAllUsers')}
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Note */}
          {isAdmin && (
            <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    {t('profile.adminNote')}
                  </h3>
                  <div className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                    <p>{t('profile.adminDescription')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
