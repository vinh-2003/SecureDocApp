import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Components
import { ProtectedRoute, PublicRoute } from '../components/Auth';
import { Loading } from '../components/Common';

// Layout
import MainLayout from '../layouts/MainLayout';

// Routes config
import { publicRoutes, privateRoutes } from './index';
import ErrorPage from '../pages/Error/ErrorPage';

/**
 * Loading fallback cho Suspense
 */
const PageLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loading variant="inline" size="lg" text="Đang tải trang..." />
    </div>
);

/**
 * App Routes
 */
const AppRoutes = () => {
    return (
        <Suspense fallback={<PageLoading />}>
            <Routes>
                {/* PUBLIC ROUTES - Chỉ cho user chưa đăng nhập */}
                <Route element={<PublicRoute />}>
                    {publicRoutes.map(({ path, element: Element }) => (
                        <Route
                            key={path}
                            path={path}
                            element={<Element />}
                        />
                    ))}
                </Route>

                {/* PRIVATE ROUTES - Yêu cầu đăng nhập */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        {privateRoutes.map(({ path, element: Element }) => (
                            <Route
                                key={path}
                                path={path}
                                element={<Element />}
                            />
                        ))}
                    </Route>
                </Route>

                {/* Route lỗi cụ thể (nếu muốn redirect tới) */}
                <Route path="/error/403" element={<ErrorPage status={403} />} />
                <Route path="/error/500" element={<ErrorPage status={500} />} />

                {/* 404 - Đặt ở cuối cùng */}
                <Route path="*" element={<ErrorPage status={404} />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;