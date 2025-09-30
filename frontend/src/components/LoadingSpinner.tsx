import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="text-dark-400">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
