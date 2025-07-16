import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, ArrowRight, User, Users } from 'lucide-react';
import { BudgetAnalysis as BudgetAnalysisType, SavingsGoal } from '../types';
import { DateRange, DateRangeFilter, getDefaultDateRange } from './DateRangeFilter';

interface BudgetAnalysisProps {
  budgetAnalysis: BudgetAnalysisType[];
  savingsGoals: SavingsGoal[];
  budgetSetup?: any;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

export const BudgetAnalysis: React.FC<BudgetAnalysisProps> = ({ 
  budgetAnalysis, 
  savingsGoals, 
  budgetSetup,
  dateRange = getDefaultDateRange(),
  onDateRangeChange
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getTrendIcon = (trend: 'over' | 'under' | 'on-track') => {
    switch (trend) {
      case 'over':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'under':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Target className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: 'over' | 'under' | 'on-track') => {
    switch (trend) {
      case 'over':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'under':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Filter budget analysis by assignment
  const selfAnalysis = budgetAnalysis.filter(analysis => 
    analysis.category.includes('self') || analysis.assignedTo === 'self'
  );
  const spouseAnalysis = budgetAnalysis.filter(analysis => 
    analysis.category.includes('spouse') || analysis.assignedTo === 'spouse'
  );
  const sharedAnalysis = budgetAnalysis.filter(analysis => 
    !analysis.assignedTo || analysis.assignedTo === 'shared'
  );

  const renderAnalysisSection = (
    analyses: BudgetAnalysisType[], 
    title: string, 
    icon: React.ReactNode,
    colorClass: string
  ) => {
    if (analyses.length === 0) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${colorClass} rounded-lg`}>
              {icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="text-sm text-gray-500">Current Month</div>
        </div>

        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div key={analysis.category} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(analysis.trend)}
                  <h3 className="font-medium text-gray-900">{analysis.category}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor(analysis.trend)}`}>
                    {analysis.trend === 'over' ? 'Over Budget' : 
                     analysis.trend === 'under' ? 'Under Budget' : 'On Track'}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${analysis.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {analysis.variance >= 0 ? '+' : ''}{formatCurrency(analysis.variance)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analysis.variancePercentage >= 0 ? '+' : ''}{analysis.variancePercentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Actual</p>
                  <p className="font-medium text-gray-900">{formatCurrency(analysis.actual)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Budgeted</p>
                  <p className="font-medium text-gray-900">{formatCurrency(analysis.budgeted)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Historical Avg</p>
                  <p className="font-medium text-gray-900">{formatCurrency(analysis.historicalAverage)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Recommended</p>
                  <div className="flex items-center space-x-1">
                    <p className="font-medium text-blue-600">{formatCurrency(analysis.recommendedBudget)}</p>
                    {analysis.recommendedBudget !== analysis.budgeted && (
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {analysis.impactOnGoals > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Overspending impacts savings goals by {analysis.impactOnGoals.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{((analysis.actual / analysis.budgeted) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      analysis.actual > analysis.budgeted ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((analysis.actual / analysis.budgeted) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Analysis</h2>
          <p className="text-gray-600">Budget vs actual spending for {dateRange.label}</p>
        </div>
        {onDateRangeChange && (
          <DateRangeFilter selectedRange={dateRange} onRangeChange={onDateRangeChange} />
        )}
      </div>

      {/* Individual Budget Analysis Sections */}
      {budgetSetup && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Budget Analysis */}
          {renderAnalysisSection(
            selfAnalysis.length > 0 ? selfAnalysis : budgetAnalysis.slice(0, Math.ceil(budgetAnalysis.length / 2)),
            `${budgetSetup?.selfName || 'Your'} Budget Analysis`,
            <User className="h-5 w-5 text-blue-600" />,
            'bg-blue-100'
          )}

          {/* Spouse Budget Analysis */}
          {renderAnalysisSection(
            spouseAnalysis.length > 0 ? spouseAnalysis : budgetAnalysis.slice(Math.ceil(budgetAnalysis.length / 2)),
            `${budgetSetup?.spouseName || 'Spouse'} Budget Analysis`,
            <User className="h-5 w-5 text-purple-600" />,
            'bg-purple-100'
          )}
        </div>
      )}

      {/* Combined/Shared Budget Analysis */}
      {renderAnalysisSection(
        budgetSetup ? sharedAnalysis : budgetAnalysis,
        budgetSetup ? 'Shared Budget Analysis' : 'Budget vs Actual Analysis',
        budgetSetup ? <Users className="h-5 w-5 text-green-600" /> : <Target className="h-5 w-5 text-blue-600" />,
        budgetSetup ? 'bg-green-100' : 'bg-blue-100'
      )}

      {/* Savings Goals Impact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Savings Goals Impact</h2>
        
        <div className="space-y-4">
          {savingsGoals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const monthsRemaining = Math.max(1, 
              Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))
            );
            const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsRemaining;
            const isOnTrack = goal.monthlyContribution >= requiredMonthly;

            return (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Target className={`h-5 w-5 ${isOnTrack ? 'text-green-500' : 'text-amber-500'}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">{goal.name}</h3>
                      <p className="text-sm text-gray-500">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                        {goal.assignedTo && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {goal.assignedTo === 'shared' ? 'Shared' : 
                             goal.assignedTo === 'self' ? budgetSetup?.selfName || 'You' : 
                             budgetSetup?.spouseName || 'Spouse'}
                          </span>
                        )}
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

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Monthly Contribution</p>
                    <p className="font-medium text-gray-900">{formatCurrency(goal.monthlyContribution)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Required Monthly</p>
                    <p className={`font-medium ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(requiredMonthly)}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>

                {!isOnTrack && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <p className="text-sm text-amber-800">
                        Increase monthly contribution by {formatCurrency(requiredMonthly - goal.monthlyContribution)} to stay on track
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};