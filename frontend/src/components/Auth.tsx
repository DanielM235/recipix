import React, { useState } from 'react'
import LoginForm from './LoginForm'

const Auth: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode)
  }

  return (
    <LoginForm 
      onToggleMode={toggleMode} 
      isRegisterMode={isRegisterMode} 
    />
  )
}

export default Auth
