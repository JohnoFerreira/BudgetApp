import { useMemo } from 'react';
import { Transaction, Budget, SavingsGoal, BudgetAnalysis } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DateRange } from '../components/DateRangeFilter';

export const useSmartBudgeting = (
  transactions: Transaction[], 
  savingsGoals: SavingsGoal[],
  dateRange?: DateRange
) => {
  const currentMonth = new Date();
  
  // Use date range if provided, otherwise default to current month
  const filterStart = dateRange ? new Date(dateRange.startDate) : startOfMonth(currentMonth);
  const filterEnd = dateRange ? new Date(dateRange.endDate) : endOfMonth(currentMonth);

  // Calculate historical averages for the last 6 months
  const historicalData = useMemo(() => {
    const categories = [
      'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
      'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
      'Kids', 'House', 'Subscriptions', 'Ad Hoc'
    ];
    const monthlyData: Record<string, number[]> = {};
    const now = new Date();

    categories.forEach(category => {
      monthlyData[category] = [];
      
      for (let i = 1; i <= 6; i++) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthlySpending = transactions
          .filter(t => 
            t.category === category && 
            t.type === 'expense' &&
            isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
          )
          .reduce((sum, t) => {
            // Calculate the actual amount based on assignment and split
            if (t.assignedTo === 'shared' && t.splitPercentage) {
              return sum + (t.amount * (t.splitPercentage / 100));
            } else if (t.assignedTo === 'shared') {
              return sum + (t.amount * 0.55); // Default 55% for Johno
            }
            return sum + t.amount;
          }, 0);
        
        monthlyData[category].push(monthlySpending);
      }
    });

    return monthlyData;
  }, [transactions]);

  // Calculate smart budget recommendations
  const smartBudgets = useMemo(() => {
    const categories = [
      'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
      'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
      'Kids', 'House', 'Subscriptions', 'Ad Hoc'
    ];
    const currentBudgets = [
      12000, 2500, 2000, 1500, 4000, 3000, 2500, 2000, 3500, 1500, 
      5000, 2000, 8000, 4000, 1500, 5000
    ];
    const colors = [
      '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#3B82F6',
      '#06B6D4', '#84CC16', '#F97316', '#EF4444', '#8B5CF6', '#DC2626',
      '#059669', '#7C3AED', '#0EA5E9', '#6B7280'
    ];

    return categories.map((category, index) => {
      const historicalSpending = historicalData[category] || [];
      const historicalAverage = historicalSpending.length > 0 
        ? historicalSpending.reduce((sum, val) => sum + val, 0) / historicalSpending.length 
        : 0;

      const currentSpent = transactions
        .filter(t => 
          t.category === category && 
          t.type === 'expense' &&
          isWithinInterval(new Date(t.date), { start: filterStart, end: filterEnd })
        )
        .reduce((sum, t) => {
          // Calculate the actual amount based on assignment and split
          if (t.assignedTo === 'shared' && t.splitPercentage) {
            return sum + (t.amount * (t.splitPercentage / 100));
          } else if (t.assignedTo === 'shared') {
            return sum + (t.amount * 0.5); // Default 50/50 split
          }
          return sum + t.amount;
        }, 0);

      // Calculate trend
      const recentAvg = historicalSpending.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
      const olderAvg = historicalSpending.slice(3, 6).reduce((sum, val) => sum + val, 0) / 3;
      const trend = recentAvg > olderAvg * 1.1 ? 'increasing' : 
                   recentAvg < olderAvg * 0.9 ? 'decreasing' : 'stable';

      // Calculate total monthly savings goal requirement
      const totalMonthlySavingsNeeded = savingsGoals.reduce((sum, goal) => {
        const monthsRemaining = Math.max(1, 
          Math.ceil((new Date(goal.targetDate).getTime() - currentMonth.getTime()) / (1000 * 60 * 60 * 24 * 30))
        );
        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
        return sum + (remainingAmount / monthsRemaining);
      }, 0);

      // Smart budget calculation
      let recommendedBudget = historicalAverage;
      
      // Adjust for trend
      if (trend === 'increasing') {
        recommendedBudget = Math.min(historicalAverage * 1.1, currentBudgets[index] * 1.2);
      } else if (trend === 'decreasing') {
        recommendedBudget = Math.max(historicalAverage * 0.9, currentBudgets[index] * 0.8);
      }

      // Adjust for savings goals - reduce discretionary spending
      if (['Eating Out', 'Golf', 'Wine', 'Ad Hoc', 'Clothing', 'Travel'].includes(category) && totalMonthlySavingsNeeded > 0) {
        const reductionFactor = Math.min(0.3, totalMonthlySavingsNeeded / 1000 * 0.1);
        recommendedBudget *= (1 - reductionFactor);
      }

      // Calculate confidence based on data consistency
      const variance = historicalSpending.length > 0 
        ? historicalSpending.reduce((sum, val) => sum + Math.pow(val - historicalAverage, 2), 0) / historicalSpending.length
        : 0;
      const confidence = Math.max(0.3, Math.min(1, 1 - (Math.sqrt(variance) / historicalAverage)));

      return {
        category,
        allocated: currentBudgets[index],
        spent: currentSpent,
        color: colors[index % colors.length],
        historicalAverage,
        trend,
        recommendedAdjustment: recommendedBudget - currentBudgets[index],
        confidence: isNaN(confidence) ? 0.5 : confidence,
        assignedTo: ['Kids', 'Groceries', 'Electricity', 'Pet Expenses', 'House'].includes(category) ? 'shared' : 
                   ['Hair/Nails/Beauty', 'Golf', 'Ad Hoc'].includes(category) ? 'self' : 'shared'
      };
    });
  }, [transactions, historicalData, savingsGoals, filterStart, filterEnd]);

  // Generate budget analysis
  const budgetAnalysis: BudgetAnalysis[] = useMemo(() => {
    return smartBudgets.map(budget => {
      const variance = budget.spent - budget.allocated;
      const variancePercentage = budget.allocated > 0 ? (variance / budget.allocated) * 100 : 0;
      
      let trend: 'over' | 'under' | 'on-track' = 'on-track';
      if (variancePercentage > 10) trend = 'over';
      else if (variancePercentage < -10) trend = 'under';

      // Calculate impact on savings goals
      const totalSavingsTarget = savingsGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);
      const impactOnGoals = variance > 0 ? (variance / totalSavingsTarget) * 100 : 0;

      return {
        category: budget.category,
        actual: budget.spent,
        budgeted: budget.allocated,
        variance,
        variancePercentage,
        historicalAverage: budget.historicalAverage,
        recommendedBudget: budget.allocated + budget.recommendedAdjustment,
        trend,
        impactOnGoals
      };
    });
  }, [smartBudgets, savingsGoals]);

  return {
    smartBudgets,
    budgetAnalysis,
    historicalData
  };
};