import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { LoadingProvider } from './providers/LoadingProvider';
import { AppDialogHost } from './components/ui/AppDialogHost';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <LoadingProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
              <AppDialogHost />
            </BrowserRouter>
          </QueryClientProvider>
        </LoadingProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
