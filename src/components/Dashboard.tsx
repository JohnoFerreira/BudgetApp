import React from 'react';
import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, RefreshCw, User, Users, PieChart, Receipt } from 'lucide-react';
import { FinancialSummary, Budget, Account, BudgetSetup } from '../types';
import { BudgetChart } from './BudgetChart';
import { TrendChart } from './TrendChart';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DateRange, DateRangeFilter, getDefaultDateRange } from './DateRangeFilter';

interface DashboardProps {
  summary: FinancialSummary;
  budgets: Budget[];
  accounts: Account[];
  transactions: any[];
  monthlyTrends: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
  budgetSetup?: BudgetSetup | null;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  budgets,
  accounts,
  transactions,
  monthlyTrends,
  lastUpdated,
  onRefresh,
  loading,
  budgetSetup,
  dateRange = getDefaultDateRange(),
  onDateRangeChange
}) => {
  const [showAllBudgets, setShowAllBudgets] = useState(false);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Calculate top spending descriptions
  const getTopSpendingDescriptions = () => {
    if (!transactions || transactions.length === 0) return [];

    const filterStart = dateRange ? new Date(dateRange.startDate) : new Date();
    const filterEnd = dateRange ? new Date(dateRange.endDate) : new Date();

    // Get current pay cycle transactions
    const currentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && isWithinInterval(transactionDate, { start: filterStart, end: filterEnd });
    });

    // Get last 6 months transactions
    const currentDate = new Date();
    const sixMonthsAgo = subMonths(currentDate, 6);
    const historicalTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' && transactionDate >= sixMonthsAgo;
    });

    // Group by description for current period
    const currentSpending = currentTransactions.reduce((acc, t) => {
      const description = t.description || 'Unknown';
      if (!acc[description]) {
        acc[description] = 0;
      }
      
      // Calculate actual amount based on assignment
      let amount = t.amount;
      if (t.assignedTo === 'shared' && t.splitPercentage) {
        amount = t.amount * (t.splitPercentage / 100);
      } else if (t.assignedTo === 'shared') {
        const defaultSplit = budgetSetup?.defaultSplitPercentage || 55;
        amount = t.amount * (defaultSplit / 100);
      }
      
      acc[description] += amount;
      return acc;
    }, {} as Record<string, number>);

    // Group by description for historical period (6 months average)
    const historicalSpending = historicalTransactions.reduce((acc, t) => {
      const description = t.description || 'Unknown';
      if (!acc[description]) {
        acc[description] = 0;
      }
      
      // Calculate actual amount based on assignment
      let amount = t.amount;
      if (t.assignedTo === 'shared' && t.splitPercentage) {
        amount = t.amount * (t.splitPercentage / 100);
      } else if (t.assignedTo === 'shared') {
        const defaultSplit = budgetSetup?.defaultSplitPercentage || 55;
        amount = t.amount * (defaultSplit / 100);
      }
      
      acc[description] += amount;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and calculate 6-month average
    const spendingData = Object.keys(currentSpending).map(description => ({
      description,
      currentAmount: currentSpending[description],
      historicalAverage: (historicalSpending[description] || 0) / 6 // 6 month average
    }));

    // Sort by current amount and take top 6
    return spendingData
      .sort((a, b) => b.currentAmount - a.currentAmount)
      .slice(0, 6);
  };

  const topSpendingDescriptions = getTopSpendingDescriptions();
  const budgetUsagePercentage = (summary.budgetUsed / summary.totalBudget) * 100;

  // Calculate individual summaries based on budget setup
  const calculateIndividualSummary = (assignedTo: 'self' | 'spouse') => {
    if (!budgetSetup) return { income: 0, expenses: 0, net: 0 };

    const income = budgetSetup.incomeSources
      .filter(source => source.isActive && source.assignedTo === assignedTo)
      .reduce((sum, source) => {
        const monthlyAmount = source.frequency === 'weekly' ? source.amount * 4.33 :
                             source.frequency === 'bi-weekly' ? source.amount * 2.17 :
                             source.frequency === 'annual' ? source.amount / 12 :
                             source.amount;
        return sum + monthlyAmount;
      }, 0);

    const expenses = budgetSetup.fixedExpenses
      .filter(expense => expense.isActive && expense.assignedTo === assignedTo)
      .reduce((sum, expense) => {
        const monthlyAmount = expense.frequency === 'weekly' ? expense.amount * 4.33 :
                             expense.frequency === 'bi-weekly' ? expense.amount * 2.17 :
                             expense.frequency === 'annual' ? expense.amount / 12 :
                             expense.amount;
        return sum + monthlyAmount;
      }, 0);

    // Add shared expenses based on split percentage
    const sharedExpenses = budgetSetup.fixedExpenses
      .filter(expense => expense.isActive && expense.assignedTo === 'shared')
      .reduce((sum, expense) => {
        const monthlyAmount = expense.frequency === 'weekly' ? expense.amount * 4.33 :
                             expense.frequency === 'bi-weekly' ? expense.amount * 2.17 :
                             expense.frequency === 'annual' ? expense.amount / 12 :
                             expense.amount;
        const splitPercentage = expense.splitPercentage || budgetSetup.defaultSplitPercentage;
        const yourShare = assignedTo === 'self' ? splitPercentage : (100 - splitPercentage);
        return sum + (monthlyAmount * (yourShare / 100));
      }, 0);

    const totalExpenses = expenses + sharedExpenses;
    return { income, expenses: totalExpenses, net: income - totalExpenses };
  };

  const selfSummary = calculateIndividualSummary('self');
  const spouseSummary = calculateIndividualSummary('spouse');

  // Filter budgets by assignment
  const selfBudgets = budgets.filter(budget => budget.assignedTo === 'self');
  const spouseBudgets = budgets.filter(budget => budget.assignedTo === 'spouse');
  const sharedBudgets = budgets.filter(budget => budget.assignedTo === 'shared' || !budget.assignedTo);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
              <PieChart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Financial Overview
              </h1>
              <p className="text-gray-600 text-lg">
                {budgetSetup ? `${budgetSetup.selfName} & ${budgetSetup.spouseName}` : 'Your'} Budget Dashboard
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {onDateRangeChange && (
                <DateRangeFilter selectedRange={dateRange} onRangeChange={onDateRangeChange} />
              )}
              {lastUpdated && (
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
                </div>
              )}
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Individual and Combined Summary Cards */}
      {budgetSetup ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{budgetSetup.selfName}</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Income</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(selfSummary.income)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Fixed Expenses</span>
                <span className="font-bold text-red-600 text-lg">{formatCurrency(selfSummary.expenses)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                <span className="font-bold text-gray-900 text-lg">Available</span>
                <span className={`font-bold text-xl ${selfSummary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selfSummary.net)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min((selfSummary.expenses / selfSummary.income) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {selfSummary.income > 0 ? ((selfSummary.expenses / selfSummary.income) * 100).toFixed(1) : 0}% of income used
              </p>
            </div>
          </div>

          {/* Spouse Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{budgetSetup.spouseName}</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Income</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(spouseSummary.income)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Fixed Expenses</span>
                <span className="font-bold text-red-600 text-lg">{formatCurrency(spouseSummary.expenses)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                <span className="font-bold text-gray-900 text-lg">Available</span>
                <span className={`font-bold text-xl ${spouseSummary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(spouseSummary.net)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min((spouseSummary.expenses / spouseSummary.income) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {spouseSummary.income > 0 ? ((spouseSummary.expenses / spouseSummary.income) * 100).toFixed(1) : 0}% of income used
              </p>
            </div>
          </div>

          {/* Combined Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Combined</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Income</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(summary.totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Expenses</span>
                <span className="font-bold text-red-600 text-lg">{formatCurrency(summary.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                <span className="font-bold text-gray-900 text-lg">Net Income</span>
                <span className={`font-bold text-xl ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netIncome)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {budgetUsagePercentage.toFixed(1)}% of budget used
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback to original summary cards if no budget setup */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netIncome)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Used</p>
                <p className="text-2xl font-bold text-amber-600">{budgetUsagePercentage.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Monthly Trends</h2>
          </div>
          <TrendChart data={monthlyTrends} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
          </div>
          <BudgetChart budgets={budgets} />
        </div>
      </div>

      {/* Budget Breakdown by Person */}
      {budgetSetup && (selfBudgets.length > 0 || spouseBudgets.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Budgets */}
          {selfBudgets.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">{budgetSetup.selfName}'s Categories</h2>
              </div>
              <div className="space-y-4">
                {selfBudgets.map((budget) => {
                  const percentage = (budget.spent / budget.allocated) * 100;
                  const isOverBudget = budget.spent > budget.allocated;
                  
                  return (
                    <div key={budget.category} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{budget.category}</span>
                        <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${Math.min(percentage, 100)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage.toFixed(1)}% used
                        {isOverBudget && (
                          <span className="text-red-600 ml-2">
                            (Over by {formatCurrency(budget.spent - budget.allocated)})
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spouse Budgets */}
          {spouseBudgets.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">{budgetSetup.spouseName}'s Categories</h2>
              </div>
              <div className="space-y-4">
                {spouseBudgets.map((budget) => {
                  const percentage = (budget.spent / budget.allocated) * 100;
                  const isOverBudget = budget.spent > budget.allocated;
                  
                  return (
                    <div key={budget.category} className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{budget.category}</span>
                        <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-red-500' : 'bg-purple-500'
                          }`}
                          style={{ 
                            width: `${Math.min(percentage, 100)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage.toFixed(1)}% used
                        {isOverBudget && (
                          <span className="text-red-600 ml-2">
                            (Over by {formatCurrency(budget.spent - budget.allocated)})
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accounts & Shared Budget Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Spending Descriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Receipt className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Spending Descriptions</h2>
          </div>
          <div className="space-y-4">
            {topSpendingDescriptions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No spending data available</p>
            ) : (
              topSpendingDescriptions.map((item, index) => (
                <div key={item.description} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-200 text-orange-800 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">Merchant/Description</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{formatCurrency(item.currentAmount)}</p>
                    <p className="text-xs text-gray-500">
                      6mo avg: {formatCurrency(item.historicalAverage)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Balances</h2>
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{account.type} Account</p>
                  </div>
                </div>
                <p className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Shared/General Budget Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {budgetSetup ? 'Shared Categories' : 'Category Budgets'}
            </h2>
          </div>
          <div className="space-y-4 mb-4">
            {(budgetSetup ? sharedBudgets : budgets)
              .slice(0, showAllBudgets ? undefined : 5)
              .map((budget) => {
              const percentage = (budget.spent / budget.allocated) * 100;
              const isOverBudget = budget.spent > budget.allocated;
              
              return (
                <div key={budget.category} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{budget.category}</span>
                    <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isOverBudget ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(percentage, 100)}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% used
                    {isOverBudget && (
                      <span className="text-red-600 ml-2">
                        (Over budget by {formatCurrency(budget.spent - budget.allocated)})
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* Show More/Less Button */}
          {(budgetSetup ? sharedBudgets : budgets).length > 5 && (
            <div className="text-center">
              <button
                onClick={() => setShowAllBudgets(!showAllBudgets)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                {showAllBudgets ? (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                    Show Less
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Show More ({(budgetSetup ? sharedBudgets : budgets).length - 5} more)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};