import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Toaster } from '@/components/ui/sonner.tsx'
import App from './app.tsx'

const root = document.getElementById('root')
if (root === null) {
	throw new Error('root is null')
}

createRoot(root).render(
	<StrictMode>
		<App />
		<Toaster />
	</StrictMode>,
)
