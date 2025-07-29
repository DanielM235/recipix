import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Upload, History, Settings, FileText } from 'lucide-react'

function Home() {
  const { t } = useTranslation()

  const features = [
    {
      name: t('navigation.upload'),
      description: t('upload.description'),
      href: '/upload',
      icon: Upload,
      color: 'bg-blue-500',
    },
    {
      name: t('navigation.history'),
      description: t('history.title'),
      href: '/history',
      icon: History,
      color: 'bg-green-500',
    },
    {
      name: t('navigation.settings'),
      description: t('settings.title'),
      href: '/settings',
      icon: Settings,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className='max-w-7xl mx-auto'>
      {/* Hero Section */}
      <div className='text-center py-12'>
        <div className='flex justify-center mb-6'>
          <div className='p-4 bg-primary-100 dark:bg-primary-900 rounded-full'>
            <FileText className='h-12 w-12 text-primary-600 dark:text-primary-400' />
          </div>
        </div>

        <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>{t('app.title')}</h1>

        <p className='text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto'>
          {t('app.description')}
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link to='/upload' className='btn btn-primary px-8 py-3 text-lg'>
            {t('upload.title')}
          </Link>

          <Link to='/history' className='btn btn-outline px-8 py-3 text-lg'>
            {t('navigation.history')}
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className='py-12'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center'>
          Features
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {features.map(feature => (
            <Link
              key={feature.name}
              to={feature.href}
              className='card hover:shadow-lg transition-shadow duration-200 group'
            >
              <div className='flex items-center mb-4'>
                <div className={`p-2 rounded-lg ${feature.color} mr-3`}>
                  <feature.icon className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors'>
                  {feature.name}
                </h3>
              </div>

              <p className='text-gray-600 dark:text-gray-300'>{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats or additional info could go here */}
      <div className='py-12 text-center'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div>
            <div className='text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2'>
              100%
            </div>
            <div className='text-gray-600 dark:text-gray-300'>Open Source</div>
          </div>

          <div>
            <div className='text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2'>🔒</div>
            <div className='text-gray-600 dark:text-gray-300'>Secure & Private</div>
          </div>

          <div>
            <div className='text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2'>⚡</div>
            <div className='text-gray-600 dark:text-gray-300'>Fast Processing</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
