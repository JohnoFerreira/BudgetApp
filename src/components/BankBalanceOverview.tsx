import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Edit3, Save, X, Calendar, CreditCard } from 'lucide-react';
import { BankBalanceData } from '../hooks/useBankBalance';
import { BudgetSetup } from '../types';
import { DateRange, DateRangeFilter, getDefaultDateRange } from './DateRangeFilter';
import { format } from 'date-fns';

interface BankBalanceOverviewProps {
  bankBalance: BankBalanceData;
  budgetSetup: BudgetSetup;
  onUpdateOpeningBalances: (johnoBalance: number, angelaBalance: number) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

export const BankBalanceOverview: React.FC<BankBalanceOverviewProps> = ({
  bankBalance,
  budgetSetup,
  onUpdateOpeningBalances,
  dateRange = getDefaultDateRange(),
  onDateRangeChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [johnoBalance, setJohnoBalance] = useState(budgetSetup.johnoOpeningBalance || 0);
  const [angelaBalance, setAngelaBalance] = useState(budgetSetup.angelaOpeningBalance || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const handleSave = () => {
    onUpdateOpeningBalances(johnoBalance, angelaBalance);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setJohnoBalance(budgetSetup.johnoOpeningBalance || 0);
    setAngelaBalance(budgetSetup.angelaOpeningBalance || 0);
    setIsEditing(false);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 10000) return 'text-green-600';
    if (balance > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-5 w-5 text-green-500" />;
    return <TrendingDown className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bank Account Balances</h1>
              <p className="text-gray-600 mt-1">
                Running balance calculation for {dateRange.label}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {onDateRangeChange && (
              <DateRangeFilter selectedRange={dateRange} onRangeChange={onDateRangeChange} />
            )}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Opening Balances
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Johno's Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{budgetSetup.selfName}</h3>
            </div>
            {getBalanceIcon(bankBalance.johno.closingBalance)}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Opening Balance</span>
              {isEditing ? (
                <input
                  type="number"
                  value={johnoBalance}
                  onChange={(e) => setJohnoBalance(parseFloat(e.target.value) || 0)}
                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <span className="font-medium text-gray-900">
                  {formatCurrency(bankBalance.johno.openingBalance)}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">+ Income</span>
              <span className="font-medium text-green-600">
                {formatCurrency(bankBalance.johno.totalIncome)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">- Fixed Expenses</span>
              <span className="font-medium text-red-600">
                {formatCurrency(bankBalance.johno.fixedExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">- Cash Expenses</span>
              <span className="font-medium text-red-600">
                {formatCurrency(bankBalance.johno.cashExpenses)}
              </span>
            </div>

            {bankBalance.johno.creditCardSettlements > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">- Credit Card Settlement</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(bankBalance.johno.creditCardSettlements)}
                </span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Closing Balance</span>
                <span className={`text-xl font-bold ${getBalanceColor(bankBalance.johno.closingBalance)}`}>
                  {formatCurrency(bankBalance.johno.closingBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Angela's Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{budgetSetup.spouseName}</h3>
            </div>
            {getBalanceIcon(bankBalance.angela.closingBalance)}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Opening Balance</span>
              {isEditing ? (
                <input
                  type="number"
                  value={angelaBalance}
                  onChange={(e) => setAngelaBalance(parseFloat(e.target.value) || 0)}
                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              ) : (
                <span className="font-medium text-gray-900">
                  {formatCurrency(bankBalance.angela.openingBalance)}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">+ Income</span>
              <span className="font-medium text-green-600">
                {formatCurrency(bankBalance.angela.totalIncome)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">- Fixed Expenses</span>
              <span className="font-medium text-red-600">
                {formatCurrency(bankBalance.angela.fixedExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">- Cash Expenses</span>
              <span className="font-medium text-red-600">
                {formatCurrency(bankBalance.angela.cashExpenses)}
              </span>
            </div>

            {bankBalance.angela.creditCardSettlements > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">- Credit Card Settlement</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(bankBalance.angela.creditCardSettlements)}
                </span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Closing Balance</span>
                <span className={`text-xl font-bold ${getBalanceColor(bankBalance.angela.closingBalance)}`}>
                  {formatCurrency(bankBalance.angela.closingBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Combined</h3>
            </div>
            {getBalanceIcon(bankBalance.combined.totalClosingBalance)}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Closing Balance</span>
              <span className={`text-xl font-bold ${getBalanceColor(bankBalance.combined.totalClosingBalance)}`}>
                {formatCurrency(bankBalance.combined.totalClosingBalance)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Income</span>
              <span className="font-medium text-green-600">
                {formatCurrency(bankBalance.combined.totalIncome)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Expenses</span>
              <span className="font-medium text-red-600">
                {formatCurrency(bankBalance.combined.totalExpenses)}
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Balance as of {format(new Date(dateRange.endDate), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Excludes credit card expenses
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Johno's Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {budgetSetup.selfName}'s Cash Transactions
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {bankBalance.johno.transactions
              .filter(t => t.paymentMethod !== 'credit_card')
              .slice(0, 10)
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {transaction.category} • {format(new Date(transaction.date), 'MMM d')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            {bankBalance.johno.transactions.filter(t => t.paymentMethod !== 'credit_card').length === 0 && (
              <p className="text-gray-500 text-center py-4">No cash transactions found</p>
            )}
          </div>
        </div>

        {/* Angela's Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {budgetSetup.spouseName}'s Cash Transactions
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {bankBalance.angela.transactions
              .filter(t => t.paymentMethod !== 'credit_card')
              .slice(0, 10)
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {transaction.category} • {format(new Date(transaction.date), 'MMM d')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            {bankBalance.angela.transactions.filter(t => t.paymentMethod !== 'credit_card').length === 0 && (
              <p className="text-gray-500 text-center py-4">No cash transactions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};