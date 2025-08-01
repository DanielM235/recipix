import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import Home from './pages/Home'

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': 'Recipix',
        'app.description': 'Capture, process, and send payment receipts to your financial management system.',
        'navigation.upload': 'Upload Receipt',
        'navigation.history': 'History', 
        'navigation.settings': 'Settings',
        'upload.description': 'Upload and process your receipts',
        'history.title': 'View your receipt history',
        'settings.title': 'Configure your settings'
      }
      return translations[key] || key
    }
  })
}))

jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  History: () => <div data-testid="history-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  FileText: () => <div data-testid="filetext-icon" />
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {component}
    </BrowserRouter>
  )
}

describe('Home Component', () => {
  test('renders without crashing', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Recipix')).toBeInTheDocument()
  })

  test('displays main title and description', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Recipix')).toBeInTheDocument()
    expect(screen.getByText('Capture, process, and send payment receipts to your financial management system.')).toBeInTheDocument()
  })

  test('displays navigation features', () => {
    renderWithRouter(<Home />)
    expect(screen.getByTestId('upload-icon')).toBeInTheDocument()
    expect(screen.getByTestId('history-icon')).toBeInTheDocument()
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
  })

  test('displays feature cards with descriptions', () => {
    renderWithRouter(<Home />)
    expect(screen.getByText('Upload and process your receipts')).toBeInTheDocument()
    expect(screen.getByText('View your receipt history')).toBeInTheDocument()
    expect(screen.getByText('Configure your settings')).toBeInTheDocument()
  })

  test('has correct navigation links', () => {
    renderWithRouter(<Home />)
    
    const links = screen.getAllByRole('link')
    const uploadLink = links.find(link => link.getAttribute('href') === '/upload')
    const historyLink = links.find(link => link.getAttribute('href') === '/history') 
    const settingsLink = links.find(link => link.getAttribute('href') === '/settings')
    
    expect(uploadLink).toBeInTheDocument()
    expect(historyLink).toBeInTheDocument()
    expect(settingsLink).toBeInTheDocument()
  })

  test('displays stats section', () => {
    renderWithRouter(<Home />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Open Source')).toBeInTheDocument()
    expect(screen.getByText('🔒')).toBeInTheDocument()
    expect(screen.getByText('Secure & Private')).toBeInTheDocument()
    expect(screen.getByText('⚡')).toBeInTheDocument()
    expect(screen.getByText('Fast Processing')).toBeInTheDocument()
  })
})
