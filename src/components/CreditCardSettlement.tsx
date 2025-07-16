import React, { useState } from 'react';
import { CreditCard, Calendar, DollarSign, CheckCircle, AlertTriangle, User, Users } from 'lucide-react';
import { CreditCardBalance, Transaction } from '../types';
import { format } from 'date-fns';

interface CreditCardSettlementProps {
  creditCardBalance: CreditCardBalance;
  onSettlement: () => void;
}

export const CreditCardSettlement: React.FC<CreditCardSettlementProps> = ({
  creditCardBalance,
  onSettlement
}) => {
  const [showTransactions, setShowTransactions] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const hasOutstandingBalance = creditCardBalance.totalOutstanding > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${hasOutstandingBalance ? 'bg-red-100' : 'bg-green-100'} rounded-lg`}>
            <CreditCard className={`h-6 w-6 ${hasOutstandingBalance ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Credit Card Settlement</h2>
            <p className="text-sm text-gray-600">
              {creditCardBalance.lastSettlementDate 
                ? `Last settled: ${formatDate(creditCardBalance.lastSettlementDate)}`
                : 'No previous settlement recorded'
              }
            </p>
          </div>
        </div>
        
        {hasOutstandingBalance && (
          <button
            onClick={onSettlement}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Settled
          </button>
        )}
      </div>

      {/* Outstanding Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Johno's Balance */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Johno Owes</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(creditCardBalance.johnoOwes)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {creditCardBalance.transactionsSinceSettlement.filter(t => 
              t.assignedTo === 'self' || t.assignedTo === 'shared'
            ).length} transactions
          </p>
        </div>

        {/* Angela's Balance */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900">Angela Owes</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(creditCardBalance.angelaOwes)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {creditCardBalance.transactionsSinceSettlement.filter(t => 
              t.assignedTo === 'spouse' || t.assignedTo === 'shared'
            ).length} transactions
          </p>
        </div>

        {/* Total Outstanding */}
        <div className={`${hasOutstandingBalance ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className={`h-5 w-5 ${hasOutstandingBalance ? 'text-red-600' : 'text-green-600'}`} />
              <span className="font-medium text-gray-900">Total Outstanding</span>
            </div>
          </div>
          <div className={`text-2xl font-bold ${hasOutstandingBalance ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(creditCardBalance.totalOutstanding)}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {creditCardBalance.transactionsSinceSettlement.length} total transactions
          </p>
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-lg border ${
        hasOutstandingBalance 
          ? 'bg-amber-50 border-amber-200' 
          : 'bg-green-50 border-green-200'
      } mb-4`}>
        <div className="flex items-center space-x-2">
          {hasOutstandingBalance ? (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          <p className={`text-sm font-medium ${
            hasOutstandingBalance ? 'text-amber-800' : 'text-green-800'
          }`}>
            {hasOutstandingBalance 
              ? 'Credit card settlement required'
              : 'All credit card expenses have been settled'
            }
          </p>
        </div>
      </div>

      {/* Transaction Details Toggle */}
      {creditCardBalance.transactionsSinceSettlement.length > 0 && (
        <div>
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
          >
            {showTransactions ? 'Hide' : 'Show'} Credit Card Transactions ({creditCardBalance.transactionsSinceSettlement.length})
          </button>

          {showTransactions && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {creditCardBalance.transactionsSinceSettlement
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction) => {
                  const johnoShare = transaction.assignedTo === 'self' ? transaction.amount :
                                   transaction.assignedTo === 'shared' ? (transaction.amount * (transaction.splitPercentage || 55)) / 100 : 0;
                  const angelaShare = transaction.assignedTo === 'spouse' ? transaction.amount :
                                   transaction.assignedTo === 'shared' ? (transaction.amount * (100 - (transaction.splitPercentage || 55))) / 100 : 0;

                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{transaction.description}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.assignedTo === 'self' ? 'bg-blue-100 text-blue-800' :
                            transaction.assignedTo === 'spouse' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {transaction.assignedTo === 'self' ? 'Johno' :
                             transaction.assignedTo === 'spouse' ? 'Angela' : 'Shared'}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-1">
                          {transaction.category} • {formatDate(transaction.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </div>
                        {transaction.assignedTo === 'shared' && (
                          <div className="text-xs text-gray-500">
                            J: {formatCurrency(johnoShare)} | A: {formatCurrency(angelaShare)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};