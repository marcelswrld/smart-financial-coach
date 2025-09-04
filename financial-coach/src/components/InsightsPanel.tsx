import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Bell, Sparkles, Bot } from 'lucide-react';
import { theme } from '../theme';

interface Insight {
  id: string;
  message: string;
  type: 'tip' | 'ai' | 'notification';
  timestamp: Date;
}

interface InsightsPanelProps {
  insights: string[];
  aiAdvice: string;
  opportunityCost: number;
  className?: string;
}

export function InsightsPanel({ insights, aiAdvice, opportunityCost, className = '' }: InsightsPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Convert insights to structured format
  const structuredInsights: Insight[] = insights.map((insight, index) => ({
    id: `insight-${index}`,
    message: insight,
    type: 'tip' as const,
    timestamp: new Date(Date.now() - (insights.length - index) * 60000), // Stagger timestamps
  }));

  // Add AI advice as a separate insight
  const aiInsight: Insight = {
    id: 'ai-advice',
    message: aiAdvice,
    type: 'ai',
    timestamp: new Date(),
  };

  const allInsights = [...structuredInsights, aiInsight];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Coach Insights
        </CardTitle>
        <p className="text-sm text-gray-600">
          Personalized nudges to reach your goal faster
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights Chat */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {allInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: theme.animation.duration.normal,
                delay: index * 0.1,
                ease: theme.animation.easing.easeOut
              }}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {insight.type === 'ai' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex-1">
                  <div className={`inline-block px-4 py-2 rounded-2xl max-w-xs ${
                    insight.type === 'ai' 
                      ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                      : 'bg-gray-50 text-gray-900'
                  }`}>
                    <p className="text-sm leading-relaxed">{insight.message}</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 ml-2">
                    {formatTime(insight.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Separator />

        {/* Opportunity Cost */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-sm font-medium text-amber-800">Opportunity Cost</span>
          </div>
          <p className="text-sm text-amber-700">
            If you keep current spending pace over 12 months, you'll miss out on{' '}
            <strong>{formatCurrency(opportunityCost)}</strong> in potential savings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
