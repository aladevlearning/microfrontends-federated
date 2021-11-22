import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from 'src/components/DashboardLayout';
import MainLayout from 'src/components/MainLayout';
import Dashboard from 'src/pages/Dashboard';
import NotFound from 'src/pages/NotFound';
import { dynamicImport } from 'mfe-core/devtools/loader.js'
const AccountsApp = lazy(
    () => {
        return dynamicImport('mfeAccounts/App');
    }
);

const PaymentsApp = lazy(
    () => {
        return dynamicImport('mfePayments/App');
    }
);

const routes = [
    {
        path: 'app',
        element: <DashboardLayout />,
        children: [
            { path: 'accounts', element: <Suspense fallback='Loading Button'><AccountsApp /></Suspense> },
            { path: 'payments', element: <Suspense fallback='Loading Button'><PaymentsApp /></Suspense> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: '*', element: <Navigate to="/404" /> }
        ]
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { path: '404', element: <NotFound /> },
            { path: '/', element: <Navigate to="/app/payments" /> },
            { path: '*', element: <Navigate to="/404" /> }
        ]
    }
];

export default routes;