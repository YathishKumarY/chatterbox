import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { OAuthButtons } from '../components/auth/OAuthButtons';
export function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="fixed inset-0 bg-cb-bg flex items-center justify-center p-4">
      <div className="bg-cb-surface rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/favicon.svg" alt="ChatterBox" className="w-10 h-10" />
          <h1 className="text-3xl font-bold text-cb-teal">ChatterBox</h1>
        </div>

        {isLogin ? (
          <LoginForm onSwitch={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitch={() => setIsLogin(true)} />
        )}

        <OAuthButtons />
      </div>
    </div>
  );
}
