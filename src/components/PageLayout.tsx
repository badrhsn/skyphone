import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  icon: LucideIcon;
  backHref?: string;
  headerAction?: ReactNode;
}

export default function PageLayout({
  children,
  title,
  description,
  icon: Icon,
  backHref = "/dashboard",
  headerAction
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                {backHref ? (
                  <Link 
                    href={backHref}
                    className="p-2 hover:bg-white/80 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </Link>
                ) : null}
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                </div>
              </div>
            </div>
            {headerAction && (
              <div>{headerAction}</div>
            )}
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

// Card component for consistent styling
interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-3xl border border-[#e6fbff] ${className}`}>
      {children}
    </div>
  );
}

// Button component for consistent styling
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = ""
}: ButtonProps) {
  const baseClasses = "font-medium rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#00aff0] to-[#0099d6] hover:from-[#0099d6] hover:to-[#0086c2] text-white",
    secondary: "bg-white border border-[#e6fbff] text-gray-900 hover:bg-[#f3fbff]",
    ghost: "text-[#00aff0] hover:text-[#0086c2] hover:bg-white/50"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}