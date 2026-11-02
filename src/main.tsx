import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@astryxdesign/core';
import { appTheme } from './theme';
import { App } from './App';
import { DemoStoreProvider } from './context/DemoStoreContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Theme theme={appTheme} mode="dark">
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <DemoStoreProvider>
            <App />
          </DemoStoreProvider>
        </BrowserRouter>
      </Theme>
    </QueryClientProvider>
  </React.StrictMode>
);
