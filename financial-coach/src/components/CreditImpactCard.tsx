import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Minus, CreditCard, AlertCircle } from 'lucide-react';
import { theme } from '../theme';

interface CreditImpactCardProps {
  className?: string;
}

export function CreditImpactCard({ className = '' }: CreditImpactCardProps) {
  // Mock credit score data - in production this would come from credit bureau APIs
  const mockCreditScore = 720;
  const mockTrend = 'up' as 'up' | 'down' | 'neutral';
  const mockTrendValue = '+15';
  const mockLastUpdated = '2 weeks ago';

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = () => {
    switch (mockTrend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (mockTrend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: theme.animation.duration.normal,
        delay: 0.3,
        ease: theme.animation.easing.easeOut
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: theme.animation.duration.fast }
      }}
    >
      <Card className={`h-full transition-shadow duration-200 hover:shadow-lg ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-gray-700">
            <CreditCard className="w-5 h-5" />
            Credit Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Credit Score */}
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold ${getScoreColor(mockCreditScore)} mb-1`}>
              {mockCreditScore}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {getScoreLabel(mockCreditScore)} Credit Score
            </div>
            
            {/* Trend Indicator */}
            <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{mockTrendValue} points</span>
            </div>
          </div>

          {/* Score Range Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>300</span>
              <span>850</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((mockCreditScore - 300) / (850 - 300)) * 100}%` }}
                transition={{ 
                  duration: theme.animation.duration.slow,
                  delay: 0.5,
                  ease: theme.animation.easing.easeOut
                }}
              />
            </div>
          </div>

          {/* Factors */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Payment History</span>
              <span className="text-green-600 font-medium">✓ Excellent</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Credit Utilization</span>
              <span className="text-blue-600 font-medium">✓ Good</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Credit Age</span>
              <span className="text-yellow-600 font-medium">⚠ Fair</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-400 text-center">
            Last updated: {mockLastUpdated}
          </div>

          {/* Future Integration Note */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <strong>Future Enhancement:</strong> This will integrate with credit bureau APIs 
                (Experian, TransUnion, Equifax) for real-time credit monitoring and alerts.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
