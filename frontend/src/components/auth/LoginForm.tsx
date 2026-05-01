import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-cb-teal">Sign In</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-cb-text-secondary mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-cb-border rounded-lg focus:ring-2 focus:ring-cb-teal focus:border-transparent outline-none bg-cb-surface text-cb-text-primary placeholder:text-cb-text-muted"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-cb-text-secondary mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-cb-border rounded-lg focus:ring-2 focus:ring-cb-teal focus:border-transparent outline-none bg-cb-surface text-cb-text-primary placeholder:text-cb-text-muted"
          placeholder="Your password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-cb-teal text-white py-2 rounded-lg hover:bg-cb-dark transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-cb-text-secondary">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-cb-teal hover:underline">
          Sign up
        </button>
      </p>
    </form>
  );
}
