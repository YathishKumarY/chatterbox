import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { OAuthButtons } from '../components/auth/OAuthButtons';
import { useThemeStore } from '../store/themeStore';
import { MessageCircle, Sun, Moon } from 'lucide-react';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-cb-bg flex items-center justify-center p-4 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-cb-surface hover:bg-cb-surface-active transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-cb-text-secondary" />
        ) : (
          <Moon className="w-5 h-5 text-cb-text-secondary" />
        )}
      </button>

      <div className="bg-cb-surface rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MessageCircle className="w-10 h-10 text-cb-teal" />
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
