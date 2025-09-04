import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { theme } from '../theme';

interface Transaction {
  date: string;
  category: string;
  amount: number;
  merchant?: string;
}

interface Profile {
  monthlyIncome: number;
  recurringBills: number;
  currentSavings: number;
  goalAmount: number;
  goalName: string;
}

interface ChartsProps {
  transactions: Transaction[];
  profile: Profile;
  className?: string;
}

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
];

export function Charts({ transactions, profile, className = '' }: ChartsProps) {
  // Process data for pie chart
  const categoryData = React.useMemo(() => {
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : '0',
        total: amount,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Process data for line chart
  const lineChartData = React.useMemo(() => {
    const monthlyData = transactions.reduce((acc, t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, spend: 0, cumulative: 0, income: profile.monthlyIncome };
      }
      acc[month].spend += t.amount;
      return acc;
    }, {} as Record<string, { month: string; spend: number; cumulative: number; income: number }>);

    // Convert to array and calculate cumulative
    let cumulative = 0;
    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => {
        cumulative += item.spend;
        return {
          ...item,
          cumulative,
          net: item.income - item.spend,
        };
      });
  }, [transactions, profile.monthlyIncome]);

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.percentage}% of total spending
          </p>
          <p className="text-sm font-medium text-gray-800">
            ${data.total.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Monthly spend: <span className="font-medium">${data.spend.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Cumulative: <span className="font-medium">${data.cumulative.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Net (Income - Spend): <span className={`font-medium ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${data.net.toFixed(2)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
          <p className="text-sm text-gray-600">
            Upload data to see your spending patterns
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
        <p className="text-sm text-gray-600">
          Visualize your spending patterns and trends
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pie Chart - Spending by Category */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Spending by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-gray-700">
                      {entry.payload.name} ({entry.payload.percentage}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - Monthly Trends */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Spending vs. Income</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  name="Monthly Spend" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Monthly Income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  name="Cumulative Spend" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
