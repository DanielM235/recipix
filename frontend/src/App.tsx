import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Upload from './pages/Upload'
import History from './pages/History'
import Settings from './pages/Settings'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
