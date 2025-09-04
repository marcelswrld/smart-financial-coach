import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { theme } from '../theme';

interface Transaction {
  date: string;
  category: string;
  amount: number;
  merchant?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  className?: string;
}

export function TransactionsTable({ transactions, className = '' }: TransactionsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
    ];
    const index = category.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <p className="text-sm text-gray-600">
            No transactions to display
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <p className="text-sm text-gray-600">
          Your spending activity over time
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Merchant</th>
                <th className="text-left py-3 px-2 font-medium text-gray-700">Category</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: theme.animation.duration.fast,
                    delay: index * 0.05,
                    ease: theme.animation.easing.easeOut
                  }}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-2 text-gray-600">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="py-3 px-2 text-gray-900 font-medium">
                    {transaction.merchant || '—'}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
