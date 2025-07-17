import { useMemo } from 'react';
import { Transaction, Budget, Account, FinancialSummary, SavingsGoal } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, isBefore } from 'date-fns';
import { DateRange } from '../components/DateRangeFilter';

export const useFinancialData = (
  transactions: Transaction[], 
  savingsGoals: SavingsGoal[] = [],
  dateRange?: DateRange
) => {
  const currentMonth = new Date();
  
  // Use date range if provided, otherwise default to current month
  const filterStart = dateRange ? new Date(dateRange.startDate) : startOfMonth(currentMonth);
  const filterEnd = dateRange ? new Date(dateRange.endDate) : endOfMonth(currentMonth);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: filterStart, end: filterEnd });
    });
  }, [transactions, filterStart, filterEnd]);

  // Calculate historical averages for the last 6 months (independent of date range filter)
  const historicalAverages = useMemo(() => {
    const categories = [
      'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
      'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
      'Kids', 'House', 'Subscriptions', 'Ad Hoc'
    ];
    
    const averages: Record<string, number> = {};
    const now = new Date();
    
    categories.forEach(category => {
      const monthlyTotals: number[] = [];
      
      // Calculate spending for each of the last 6 months
      for (let i = 1; i <= 6; i++) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthlySpending = transactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return t.category === category && 
                   t.type === 'expense' &&
                   isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
          })
          .reduce((sum, t) => {
            // Calculate the actual amount based on assignment and split
            if (t.assignedTo === 'shared' && t.splitPercentage) {
              return sum + (t.amount * (t.splitPercentage / 100));
            } else if (t.assignedTo === 'shared') {
              return sum + (t.amount * 0.55); // Default 55% for Johno
            }
            return sum + t.amount;
          }, 0);
        
        monthlyTotals.push(monthlySpending);
      }
      
      // Calculate average (only include months with data)
      const validMonths = monthlyTotals.filter(total => total > 0);
      averages[category] = validMonths.length > 0 
        ? monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length
        : 0;
    });
    
    return averages;
  }, [transactions]);

  const summary: FinancialSummary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBudget = 47250; // Sum of all category budgets in ZAR (converted from USD)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const totalSavingsGoals = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const projectedSavings = Math.max(0, totalIncome - totalExpenses);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      totalBudget,
      budgetUsed: totalExpenses,
      savingsRate,
      totalSavingsGoals,
      projectedSavings
    };
  }, [filteredTransactions, savingsGoals]);

  const budgets: Budget[] = useMemo(() => {
    const categories = [
      'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
      'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
      'Kids', 'House', 'Subscriptions', 'Ad Hoc'
    ];
    const budgetAllocations = [
      12000, 2500, 2000, 1500, 4000, 3000, 2500, 2000, 3500, 1500, 
      5000, 2000, 8000, 4000, 1500, 5000
    ]; // Budget allocations in ZAR for each category
    const colors = [
      '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#3B82F6',
      '#06B6D4', '#84CC16', '#F97316', '#EF4444', '#8B5CF6', '#DC2626',
      '#059669', '#7C3AED', '#0EA5E9', '#6B7280'
    ];

    return categories.map((category, index) => {
      const spent = filteredTransactions
        .filter(t => t.category === category && t.type === 'expense')
        .reduce((sum, t) => {
          // Calculate the actual amount for this person based on assignment and split
          if (t.assignedTo === 'shared' && t.splitPercentage) {
            return sum + (t.amount * (t.splitPercentage / 100));
          } else if (t.assignedTo === 'shared') {
            return sum + (t.amount * 0.5); // Default 50/50 split
          }
          return sum + t.amount;
        }, 0);

      return {
        category,
        allocated: budgetAllocations[index],
        spent,
        color: colors[index % colors.length],
        historicalAverage: historicalAverages[category] || 0,
        trend: 'stable' as const,
        recommendedAdjustment: 0,
        confidence: 0.8,
        assignedTo: ['Kids', 'Groceries', 'Electricity', 'Pet Expenses', 'House'].includes(category) ? 'shared' : 
                   ['Hair/Nails/Beauty', 'Golf', 'Ad Hoc'].includes(category) ? 'self' : 'shared'
      };
    });
  }, [filteredTransactions]);

  const accounts: Account[] = useMemo(() => {
    const accountGroups = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.account]) {
        acc[transaction.account] = 0;
      }
      acc[transaction.account] += transaction.type === 'income' ? transaction.amount : -transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(accountGroups).map(([name, balance], index) => ({
      id: `account-${index}`,
      name,
      balance,
      type: name.toLowerCase().includes('credit') ? 'credit' : 
            name.toLowerCase().includes('savings') ? 'savings' : 'checking'
    }));
  }, [transactions]);

  const monthlyTrends = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(date, 'MMM yyyy'),
        income,
        expenses,
        net: income - expenses
      };
    }).reverse();

    return last6Months;
  }, [transactions, currentMonth]);

  return {
    filteredTransactions,
    summary,
    budgets,
    accounts,
    monthlyTrends,
    dateRange: { start: filterStart, end: filterEnd }
  };
};