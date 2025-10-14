import { useMemo } from 'react';
import { Transaction, Budget, Account, FinancialSummary, SavingsGoal, BudgetSetup } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, isBefore } from 'date-fns';
import { DateRange } from '../components/DateRangeFilter';

export const useFinancialData = (
  transactions: Transaction[], 
  savingsGoals: SavingsGoal[] = [],
  dateRange?: DateRange,
  budgetSetup?: BudgetSetup | null
) => {
  const currentDate = new Date();
  
  // Use date range if provided, otherwise default to current pay cycle
  const getPayCycleStart = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    if (day >= 25) {
      return new Date(year, month, 25);
    } else {
      return new Date(year, month - 1, 25);
    }
  };

  const getPayCycleEnd = (startDate: Date) => {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    return new Date(year, month + 1, 24);
  };

  const filterStart = dateRange ? new Date(dateRange.startDate) : getPayCycleStart(currentDate);
  const filterEnd = dateRange ? new Date(dateRange.endDate) : getPayCycleEnd(getPayCycleStart(currentDate));

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
              const defaultSplit = budgetSetup?.defaultSplitPercentage || 55;
              return sum + (t.amount * (defaultSplit / 100));
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
    // Use manual budgets if available, otherwise fall back to default budgets
    const manualBudgets = budgetSetup?.manualBudgets || [];
    
    // Default categories and allocations for fallback
    const defaultCategories = [
      'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
      'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
      'Kids', 'House', 'Subscriptions', 'Ad Hoc'
    ];
    const defaultBudgetAllocations = [
      12000, 2500, 2000, 1500, 4000, 3000, 2500, 2000, 3500, 1500, 
      5000, 2000, 8000, 4000, 1500, 5000
    ];
    
    const colors = [
      '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#3B82F6',
      '#06B6D4', '#84CC16', '#F97316', '#EF4444', '#8B5CF6', '#DC2626',
      '#059669', '#7C3AED', '#0EA5E9', '#6B7280'
    ];

    // Use manual budgets if available
    if (manualBudgets.length > 0) {
      return manualBudgets
        .filter(budget => budget.isActive)
        .map((manualBudget, index) => {
          const spent = filteredTransactions
            .filter(t => t.category === manualBudget.category && t.type === 'expense')
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
            category: manualBudget.category,
            allocated: manualBudget.allocatedAmount,
            spent,
            color: colors[index % colors.length],
            historicalAverage: historicalAverages[manualBudget.category] || 0,
            trend: 'stable' as const,
            recommendedAdjustment: 0,
            confidence: 0.8,
            assignedTo: manualBudget.assignedTo
          };
        });
    }

    // Fallback to default budgets
    return defaultCategories.map((category, index) => {
      const spent = filteredTransactions
        .filter(t => t.category === category && t.type === 'expense')
        .reduce((sum, t) => {
          // Calculate the actual amount for this person based on assignment and split
          if (t.assignedTo === 'shared' && t.splitPercentage) {
            return sum + (t.amount * (t.splitPercentage / 100));
          } else if (t.assignedTo === 'shared') {
            const defaultSplit = budgetSetup?.defaultSplitPercentage || 55;
            return sum + (t.amount * (defaultSplit / 100));
          }
          return sum + t.amount;
        }, 0);

      return {
        category,
        allocated: defaultBudgetAllocations[index],
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
  }, [filteredTransactions, budgetSetup, historicalAverages]);

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
    const last6PayCycles = Array.from({ length: 6 }, (_, i) => {
      // Calculate pay cycle dates going back i cycles
      const currentStart = getPayCycleStart(currentDate);
      const cycleStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - i, 25);
      const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 24);
      
      const cycleTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return isWithinInterval(transactionDate, { start: cycleStart, end: cycleEnd });
      });

      const income = cycleTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = cycleTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(cycleStart, 'MMM dd') + ' - ' + format(cycleEnd, 'MMM dd'),
        income,
        expenses,
        net: income - expenses
      };
    }).reverse();

    return last6PayCycles;
  }, [transactions, currentDate]);

  return {
    filteredTransactions,
    summary,
    budgets,
    accounts,
    monthlyTrends,
    dateRange: { start: filterStart, end: filterEnd }
  };
};