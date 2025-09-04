import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { theme } from '../theme';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  delay?: number;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  className = '',
  delay = 0 
}: KPICardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: theme.animation.duration.normal,
        delay: delay * 0.1,
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
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
              <span className="text-lg">{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
