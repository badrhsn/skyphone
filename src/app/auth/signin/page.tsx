"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

export default function SignIn() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect authenticated users
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Check if user is admin
      const isAdmin = session.user?.isAdmin || session.user?.email === 'admin@yadaphone.com';
      
      if (isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
        setIsLoading(false);
      } else if (result?.ok) {
        // Get fresh session to check user role
        const session = await fetch('/api/auth/session').then(res => res.json());
        
        // Check if user is admin by email or role
        const isAdmin = session?.user?.role === 'admin' || session?.user?.email === 'admin@yadaphone.com';
        
        if (isAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setError('An error occurred during sign in');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Use the standard NextAuth Google OAuth flow with explicit callback
      const result = await signIn("google", { 
        callbackUrl: "/dashboard"
      });
      // signIn with Google will redirect automatically, so we don't need to handle the result here
    } catch (error) {
      setError("Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f7fbff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00aff0' }}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Main Sign In Form */}
        <div className="rounded-2xl border border-[#e6fbff] bg-white p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sign in to your account</h2>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-[#00aff0]" />
                <span>Access your call history</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-[#00aff0]" />
                <span>Manage your credits</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-[#00aff0]" />
                <span>Continue calling worldwide</span>
              </div>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full mb-6 bg-white border border-[#e6fbff] rounded-xl px-4 py-3 flex items-center justify-center space-x-3 hover:bg-[#f3fbff] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-gray-700">Continue with Google</span>
          </button>

          <div className="text-center text-gray-500 mb-6">OR</div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border border-[#e6fbff] rounded-xl px-3 py-2 text-sm bg-white focus:border-[#00aff0] focus:ring-1 focus:ring-[#00aff0]"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full border border-[#e6fbff] rounded-xl px-3 py-2 pr-12 text-sm bg-white focus:border-[#00aff0] focus:ring-1 focus:ring-[#00aff0]"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Minimum 6 characters</span>
                <Link href="/forgot-password" className="text-xs text-[#00aff0] hover:text-[#0099d6]">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="stay-signed-in"
                name="stay-signed-in"
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="h-4 w-4 text-[#00aff0] focus:ring-[#00aff0] border-[#e6fbff] rounded"
              />
              <label htmlFor="stay-signed-in" className="ml-2 block text-sm text-gray-700">
                Stay signed in
              </label>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign in"}</span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-[#00aff0] hover:text-[#0099d6] font-medium">
                Sign up
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-4">
              By signing in you agree to our{" "}
              <Link href="/terms-and-conditions" className="text-[#00aff0] hover:text-[#0099d6]">
                Terms and Conditions
              </Link>
              {" "}and{" "}
              <Link href="/privacy-policy" className="text-[#00aff0] hover:text-[#0099d6]">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
