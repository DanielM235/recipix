import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import Home from '../Home'
import '../../i18n/config'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': 'Recipix',
        'app.description': 'Capture and process receipts for financial systems',
        'upload.title': 'Upload Receipt',
        'navigation.history': 'History',
      }
      return translations[key] || key
    },
  }),
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('Home Page', () => {
  it('renders the main title', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Recipix')).toBeInTheDocument()
    expect(screen.getByText('Capture and process receipts for financial systems')).toBeInTheDocument()
  })

  it('displays the upload and history buttons', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('navigates to upload page when upload button is clicked', () => {
    renderWithProviders(<Home />)
    
    const uploadButton = screen.getByText('Upload Receipt')
    expect(uploadButton).toHaveAttribute('href', '/upload')
  })

  it('displays feature cards', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Features')).toBeInTheDocument()
    // Should have 3 feature cards
    const featureCards = screen.getAllByRole('link')
    expect(featureCards).toHaveLength(5) // 2 main buttons + 3 feature cards
  })

  it('displays stats section', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Open Source')).toBeInTheDocument()
    expect(screen.getByText('Secure & Private')).toBeInTheDocument()
    expect(screen.getByText('Fast Processing')).toBeInTheDocument()
  })
})
