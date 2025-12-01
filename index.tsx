
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { PlanningProvider } from './contexts/PlanningContext';
import { TransactionProvider } from './contexts/TransactionContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
        <UserProvider>
            <PlanningProvider>
                <TransactionProvider>
                    <App />
                </TransactionProvider>
            </PlanningProvider>
        </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
);
