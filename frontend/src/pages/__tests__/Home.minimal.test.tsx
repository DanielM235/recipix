// Mock all dependencies first
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

jest.mock('lucide-react', () => ({
  Upload: () => <div>Upload Icon</div>,
  History: () => <div>History Icon</div>,
  Settings: () => <div>Settings Icon</div>,
  FileText: () => <div>FileText Icon</div>
}))

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}))

import { render, screen } from '@testing-library/react'
import Home from '../Home'

describe('Home Component - Minimal Tests', () => {
  it('renders without crashing', () => {
    render(<Home />)
    expect(screen.getByText('app.title')).toBeInTheDocument()
  })

  it('displays basic content', () => {
    render(<Home />)
    expect(screen.getByText('app.title')).toBeInTheDocument()
    expect(screen.getByText('app.description')).toBeInTheDocument()
  })

  it('has upload and history links', () => {
    render(<Home />)
    const uploadLinks = screen.getAllByText('upload.title')
    const historyLinks = screen.getAllByText('navigation.history')
    
    expect(uploadLinks.length).toBeGreaterThan(0)
    expect(historyLinks.length).toBeGreaterThan(0)
  })
})
