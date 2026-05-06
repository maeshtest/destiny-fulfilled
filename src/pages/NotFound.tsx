import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertCircle, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Optional: Send to analytics service
    // trackPageError('404', location.pathname);
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated/Decorative Elements */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-emerald-100 rounded-full opacity-20 animate-pulse"></div>
          </div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg shadow-emerald-100/50 mb-6">
              <AlertCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="space-y-3">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            404
          </h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800">
              Page Not Found
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back on track.
            </p>
          </div>
        </div>

        {/* Path Information */}
        <div className="bg-emerald-50/70 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
          <p className="text-sm font-medium text-emerald-800 mb-1">
            Attempted URL:
          </p>
          <code className="text-xs text-emerald-600 bg-white/50 px-3 py-2 rounded-lg font-mono break-all">
            {location.pathname}
          </code>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={handleGoBack}
            className="group flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <button
            onClick={handleGoHome}
            className="group flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:shadow-emerald-200/50 transform hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Return Home
          </button>
        </div>

        {/* Additional Help */}
        <div className="pt-8 border-t border-emerald-100/50">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a
              href="/contact"
              className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline transition-colors"
            >
              Contact Support
            </a>
            {" "}or{" "}
            <a
              href="/sitemap"
              className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline transition-colors"
            >
              View Sitemap
            </a>
          </p>
        </div>

        {/* Decorative Bottom Elements */}
        <div className="pt-8">
          <div className="flex items-center justify-center space-x-6 opacity-40">
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
            <div className="text-xs text-gray-400 font-medium">ERROR 404</div>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
