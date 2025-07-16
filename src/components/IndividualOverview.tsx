import React from 'react';
import { User, TrendingUp, TrendingDown, DollarSign, Calendar, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { FinancialSummary, Budget, BudgetSetup, Transaction, SavingsGoal } from '../types';
import { BudgetChart } from './BudgetChart';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DateRange, DateRangeFilter, getDefaultDateRange } from './DateRangeFilter';

interface IndividualOverviewProps {
  person: 'self' | 'spouse';
  budgetSetup: BudgetSetup;
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

export const IndividualOverview: React.FC<IndividualOverviewProps> = ({
  person,
  budgetSetup,
  transactions,
  budgets,
  savingsGoals,
  dateRange = getDefaultDateRange(),
  onDateRangeChange
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const personName = person === 'self' ? budgetSetup.selfName : budgetSetup.spouseName;
  const personColor = person === 'self' ? 'blue' : 'purple';

  // Calculate monthly amounts
  const calculateMonthlyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'bi-weekly': return amount * 2.17;
      case 'annual': return amount / 12;
      default: return amount;
    }
  };

  // Calculate person's income
  const personIncome = budgetSetup.incomeSources
    .filter(source => source.isActive && source.assignedTo === person)
    .reduce((sum, source) => sum + calculateMonthlyAmount(source.amount, source.frequency), 0);

  // Calculate person's fixed expenses
  const personFixedExpenses = budgetSetup.fixedExpenses
    .filter(expense => expense.isActive && expense.assignedTo === person)
    .reduce((sum, expense) => sum + calculateMonthlyAmount(expense.amount, expense.frequency), 0);

  // Calculate person's share of shared expenses
  const personSharedExpenses = budgetSetup.fixedExpenses
    .filter(expense => expense.isActive && expense.assignedTo === 'shared')
    .reduce((sum, expense) => {
      const monthlyAmount = calculateMonthlyAmount(expense.amount, expense.frequency);
      const splitPercentage = expense.splitPercentage || budgetSetup.defaultSplitPercentage;
      const yourShare = person === 'self' ? splitPercentage : (100 - splitPercentage);
      return sum + (monthlyAmount * (yourShare / 100));
    }, 0);

  const totalFixedExpenses = personFixedExpenses + personSharedExpenses;
  const availableIncome = personIncome - totalFixedExpenses;

  // Get current month transactions for this person
  const filterStart = new Date(dateRange.startDate);
  const filterEnd = new Date(dateRange.endDate);

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const isInRange = isWithinInterval(transactionDate, { start: filterStart, end: filterEnd });
    return isInRange && (
      transaction.assignedTo === person ||
      (transaction.assignedTo === 'shared' && transaction.type === 'expense')
    );
  });

  // Calculate actual spending by category
  const actualSpending = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      if (t.assignedTo === 'shared' && t.splitPercentage) {
        const yourShare = person === 'self' ? t.splitPercentage : (100 - t.splitPercentage);
        return sum + (t.amount * (yourShare / 100));
      } else if (t.assignedTo === 'shared') {
        const yourShare = person === 'self' ? budgetSetup.defaultSplitPercentage : (100 - budgetSetup.defaultSplitPercentage);
        return sum + (t.amount * (yourShare / 100));
      }
      return sum + t.amount;
    }, 0);

  // Filter budgets for this person
  const personBudgets = budgets.filter(budget => budget.assignedTo === person);
  const sharedBudgets = budgets.filter(budget => budget.assignedTo === 'shared' || !budget.assignedTo);

  // Calculate budget utilization
  const totalBudgetAllocated = personBudgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalBudgetSpent = personBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const budgetUtilization = totalBudgetAllocated > 0 ? (totalBudgetSpent / totalBudgetAllocated) * 100 : 0;

  // Filter savings goals for this person
  const personSavingsGoals = savingsGoals.filter(goal => 
    goal.assignedTo === person || goal.assignedTo === 'shared'
  );

  // Calculate savings rate
  const totalSavingsContributions = personSavingsGoals.reduce((sum, goal) => {
    if (goal.assignedTo === 'shared') {
      return sum + (goal.monthlyContribution * 0.5); // Assume 50/50 split for shared goals
    }
    return sum + goal.monthlyContribution;
  }, 0);

  const savingsRate = personIncome > 0 ? (totalSavingsContributions / personIncome) * 100 : 0;

  // Get recent transactions for this person
  const recentTransactions = filteredTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 bg-${personColor}-100 rounded-lg`}>
            <User className={`h-8 w-8 text-${personColor}-600`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{personName}'s Financial Overview</h1>
            <p className="text-gray-600 mt-1">
              Personal budget and spending analysis for {dateRange.label}
            </p>
          </div>
        </div>
        {onDateRangeChange && (
          <div className="mt-4">
            <DateRangeFilter selectedRange={dateRange} onRangeChange={onDateRangeChange} />
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(personIncome)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fixed Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalFixedExpenses)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Income</p>
              <p className={`text-2xl font-bold ${availableIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(availableIncome)}
              </p>
            </div>
            <div className={`p-3 ${availableIncome >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg`}>
              <DollarSign className={`h-6 w-6 ${availableIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Savings Rate</p>
              <p className="text-2xl font-bold text-blue-600">{savingsRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Income Sources and Fixed Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income Sources</h2>
          <div className="space-y-4">
            {budgetSetup.incomeSources
              .filter(source => source.isActive && source.assignedTo === person)
              .map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{source.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{source.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(source.amount)}</p>
                    <p className="text-xs text-gray-500">
                      Monthly: {formatCurrency(calculateMonthlyAmount(source.amount, source.frequency))}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Fixed Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fixed Expenses</h2>
          <div className="space-y-4">
            {/* Personal expenses */}
            {budgetSetup.fixedExpenses
              .filter(expense => expense.isActive && expense.assignedTo === person)
              .map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{expense.name}</p>
                    <p className="text-sm text-gray-600">{expense.category} • {expense.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                    <p className="text-xs text-gray-500">
                      Monthly: {formatCurrency(calculateMonthlyAmount(expense.amount, expense.frequency))}
                    </p>
                  </div>
                </div>
              ))}
            
            {/* Shared expenses */}
            {budgetSetup.fixedExpenses
              .filter(expense => expense.isActive && expense.assignedTo === 'shared')
              .map((expense) => {
                const monthlyAmount = calculateMonthlyAmount(expense.amount, expense.frequency);
                const splitPercentage = expense.splitPercentage || budgetSetup.defaultSplitPercentage;
                const yourShare = person === 'self' ? splitPercentage : (100 - splitPercentage);
                const yourAmount = monthlyAmount * (yourShare / 100);
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{expense.name}</p>
                      <p className="text-sm text-gray-600">{expense.category} • Shared ({yourShare}%)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-600">{formatCurrency(yourAmount)}</p>
                      <p className="text-xs text-gray-500">
                        Total: {formatCurrency(monthlyAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Budget Categories and Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Budget Categories */}
        {personBudgets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Budget Categories</h2>
            <div className="space-y-4">
              {personBudgets.map((budget) => {
                const percentage = (budget.spent / budget.allocated) * 100;
                const isOverBudget = budget.spent > budget.allocated;
                
                return (
                  <div key={budget.category} className={`p-4 bg-${personColor}-50 rounded-lg`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{budget.category}</span>
                      <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isOverBudget ? 'bg-red-500' : `bg-${personColor}-500`
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
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

        {/* Savings Goals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Savings Goals</h2>
          <div className="space-y-4">
            {personSavingsGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const monthsRemaining = Math.max(1, 
                Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))
              );
              const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsRemaining;
              const actualContribution = goal.assignedTo === 'shared' ? goal.monthlyContribution * 0.5 : goal.monthlyContribution;
              const isOnTrack = actualContribution >= requiredMonthly;

              return (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {isOnTrack ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{goal.name}</h3>
                        <p className="text-sm text-gray-500">
                          {goal.assignedTo === 'shared' ? 'Shared Goal' : 'Personal Goal'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </div>
                      <div className="text-xs text-gray-500">{progress.toFixed(1)}% complete</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Your Contribution</p>
                      <p className="font-medium text-gray-900">{formatCurrency(actualContribution)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Required Monthly</p>
                      <p className={`font-medium ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(requiredMonthly)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions found for this month</p>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.category} • {format(new Date(transaction.date), 'MMM d')}
                      {transaction.assignedTo === 'shared' && ' • Shared'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.account}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};