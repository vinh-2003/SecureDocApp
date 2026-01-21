import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

/**
 * Google Login button wrapper
 */
const GoogleLoginButton = ({ onSuccess, onError }) => {
    const handleError = () => {
        console.error('Google Login Failed');
        onError?.();
    };

    return (
        <div className="flex justify-center">
            <div className="w-full [&>div]:w-full [&>div>div]:w-full [&_iframe]:w-full">
                <GoogleLogin
                    onSuccess={onSuccess}
                    onError={handleError}
                    theme="outline"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                />
            </div>
        </div>
    );
};

export default GoogleLoginButton;