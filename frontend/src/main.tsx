import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Amplify } from 'aws-amplify'
import awsConfig from './aws-config'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

// Configure AWS Amplify
Amplify.configure(awsConfig)

// Initialize offline storage for offline-mode branch
import { initializeStorage } from './services/storage'
initializeStorage().catch((error) => {
  console.error('Failed to initialize offline storage:', error)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
