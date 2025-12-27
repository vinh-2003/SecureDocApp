import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login, loginWithGoogle } = useContext(AuthContext);

    const onSubmit = (data) => {
        login(data.username, data.password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">SecureDoc Login</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block mb-1 font-medium">Username</label>
                        <input
                            {...register('username', { required: 'Vui lòng nhập username' })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập username"
                        />
                        {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="font-medium">Password</label>
                            {/* Link Quên mật khẩu */}
                            <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <input
                            type="password"
                            {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="******"
                        />
                        {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                        Đăng nhập
                    </button>
                </form>

                <div className="my-4 flex items-center justify-between">
                    <hr className="w-full border-gray-300" />
                    <span className="px-2 text-gray-500 text-sm">OR</span>
                    <hr className="w-full border-gray-300" />
                </div>

                {/* Google Login Button */}
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={loginWithGoogle}
                        onError={() => {
                            console.log('Google Login Failed');
                        }}
                    />
                </div>

                <div className="mt-4 text-center text-sm">
                    Chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:underline">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;