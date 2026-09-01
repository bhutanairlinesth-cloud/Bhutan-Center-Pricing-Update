import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import './index.css';
import { AppErrorBoundary } from './components/AppErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary><I18nProvider><App/></I18nProvider></AppErrorBoundary>
  </React.StrictMode>,
);
