import React from 'react';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { CreditCardBalance } from '../types';

interface CreditCardSettlementProps {
  creditCardBalance: CreditCardBalance;
  onSettlement: () => void;
}

export const CreditCardSettlement: React.FC<CreditCardSettlementProps> = ({
  creditCardBalance,
  onSettlement
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const handleMarkAsSettled = () => {
    onSettlement();
  };

  const isSettled = creditCardBalance.totalOutstanding === 0;
  const lastSettlementDate = creditCardBalance.lastSettlementDate 
    ? new Date(creditCardBalance.lastSettlementDate).toLocaleDateString()
    : 'Never';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credit Card Settlement</h1>
            <p className="text-gray-600 mt-1">Track and settle credit card expenses</p>
          </div>
        </div>
      </div>

      {/* Settlement Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Johno's Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Johno Owes</h3>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {formatCurrency(creditCardBalance.johnoOwes)}
          </div>
          <p className="text-sm text-gray-600">Personal + shared expenses</p>
        </div>

        {/* Angela's Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Angela Owes</h3>
            <CreditCard className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {formatCurrency(creditCardBalance.angelaOwes)}
          </div>
          <p className="text-sm text-gray-600">Personal + shared expenses</p>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Outstanding</h3>
            <CreditCard className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {formatCurrency(creditCardBalance.totalOutstanding)}
          </div>
          <p className="text-sm text-gray-600">Combined credit card balance</p>
        </div>
      </div>

      {/* Settlement Status and Action */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Settlement Status</h2>
            <p className="text-gray-600">Last settlement: {lastSettlementDate}</p>
          </div>
          {isSettled ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">All Settled</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Settlement Needed</span>
            </div>
          )}
        </div>

        {!isSettled && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-900 mb-2">Settlement Instructions:</h3>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                <li>Angela transfers {formatCurrency(creditCardBalance.angelaOwes)} to Johno</li>
                <li>Johno pays the full credit card bill ({formatCurrency(creditCardBalance.totalOutstanding)})</li>
                <li>Click "Mark as Settled" below to reset the balance</li>
              </ol>
            </div>
            
            <button
              onClick={handleMarkAsSettled}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Mark as Settled
            </button>
          </div>
        )}
      </div>

      {/* Recent Credit Card Transactions */}
      {creditCardBalance.transactionsSinceSettlement.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Credit Card Transactions ({creditCardBalance.transactionsSinceSettlement.length})
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {creditCardBalance.transactionsSinceSettlement
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      {transaction.assignedTo === 'shared' && ` • Shared (${transaction.splitPercentage || 55}% Johno)`}
                      {transaction.assignedTo === 'self' && ' • Johno'}
                      {transaction.assignedTo === 'spouse' && ' • Angela'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(transaction.amount)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};