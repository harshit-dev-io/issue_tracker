import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' /* Note: Add @tailwind directives to this file manually */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)