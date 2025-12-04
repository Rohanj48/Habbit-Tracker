import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // Proxy /api requests to the Flask backend running on port 5000
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                // Optional: Rewrite path to remove /api if your Flask routes don't include it. 
                // Since your Flask routes are '/api/data' and '/api/checkin', 
                // we'll keep the path rewrite logic simple or omit it if not strictly needed.
                // For this setup, since Flask has '/api/...' routes, we don't need to rewrite.
            },
        },
    },
})
