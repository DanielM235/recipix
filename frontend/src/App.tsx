import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Auth from './components/Auth'
import Home from './pages/Home'
import Upload from './pages/Upload'
import History from './pages/History'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth />
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors'>
        <Layout>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/upload' element={<Upload />} />
            <Route path='/history' element={<History />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/profile' element={<Profile />} />
          </Routes>
        </Layout>
        <Toaster
          position='top-right'
          toastOptions={{
            duration: 4000,
            className: 'dark:bg-gray-800 dark:text-white',
          }}
        />
      </div>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
