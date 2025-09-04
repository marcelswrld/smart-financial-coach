import React from 'react';
import { motion } from 'framer-motion';
import { Upload, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { theme } from '../theme';

interface EmptyStateProps {
  onLoadSampleData: () => void;
  onFileUpload: (file: File) => void;
}

export function EmptyState({ onLoadSampleData, onFileUpload }: EmptyStateProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: theme.animation.duration.normal,
        ease: theme.animation.easing.easeOut
      }}
      className="text-center py-16 px-6"
    >
      {/* Illustration */}
      <div className="mb-8">
        <div className="relative mx-auto w-32 h-32 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-16 h-16 text-blue-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <FileText className="w-3 h-3 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Sentinel Coach
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Your personal finance dashboard is ready to help you track spending, set goals, and get AI-powered insights. 
        Start by uploading your transaction data or explore with sample data.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* File Upload */}
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
            <Upload className="w-5 h-5" />
            Upload CSV
          </div>
        </label>

        {/* Sample Data */}
        <button
          onClick={onLoadSampleData}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
        >
          <BarChart3 className="w-5 h-5" />
          Try Sample Data
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-8 text-sm text-gray-500 max-w-lg mx-auto">
        <p className="mb-2">
          <strong>CSV Format:</strong> date, category, amount, merchant
        </p>
        <p>
          Example: <code className="bg-gray-100 px-2 py-1 rounded text-xs">2024-01-15,Groceries,45.50,Trader Joe's</code>
        </p>
      </div>

      {/* Features Preview */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center p-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Smart Analytics</h3>
          <p className="text-sm text-gray-600">
            Visualize spending patterns and track progress toward your financial goals
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center p-4"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">AI Insights</h3>
          <p className="text-sm text-gray-600">
            Get personalized advice and recommendations to optimize your spending
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center p-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Easy Import</h3>
          <p className="text-sm text-gray-600">
            Upload your bank statements or manually enter transactions
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
