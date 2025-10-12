import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'pink';
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
  subtitle
}) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      icon: 'bg-blue-100 text-blue-600',
      accent: 'border-blue-200'
    },
    green: {
      bg: 'from-green-500 to-green-600', 
      icon: 'bg-green-100 text-green-600',
      accent: 'border-green-200'
    },
    yellow: {
      bg: 'from-yellow-500 to-yellow-600',
      icon: 'bg-yellow-100 text-yellow-600', 
      accent: 'border-yellow-200'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      icon: 'bg-purple-100 text-purple-600',
      accent: 'border-purple-200'
    },
    indigo: {
      bg: 'from-indigo-500 to-indigo-600',
      icon: 'bg-indigo-100 text-indigo-600',
      accent: 'border-indigo-200'
    },
    pink: {
      bg: 'from-pink-500 to-pink-600',
      icon: 'bg-pink-100 text-pink-600',
      accent: 'border-pink-200'
    }
  };

  const changeClasses = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50', 
    neutral: 'text-gray-600 bg-gray-50',
  };

  const getTrendIcon = () => {
    switch (changeType) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="group relative bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color].bg} rounded-t-2xl`} />
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {title}
              </h3>
              <div className={`p-3 rounded-xl ${colorClasses[color].icon} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {typeof value === 'number' && value % 1 !== 0 
                  ? value.toFixed(2) 
                  : value}
              </div>
              
              {subtitle && (
                <p className="text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {change && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${changeClasses[changeType]}`}>
              <TrendIcon className="w-4 h-4 mr-1" />
              <span>{change}</span>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              vs vorige periode
            </span>
          </div>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default StatsCard;