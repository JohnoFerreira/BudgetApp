import React from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Budget, SavingsGoal, BudgetSetup } from '../types';

interface SmartRecommendationsProps {
  smartBudgets: Budget[];
  savingsGoals: SavingsGoal[];
  manualBudgets: Budget[];
  budgetSetup: BudgetSetup | null;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ 
  smartBudgets = [], 
  savingsGoals = [],
  manualBudgets = [],
  budgetSetup
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  // Generate smart recommendations with error handling
  const recommendations = React.useMemo(() => {
    try {
      const recs = [];

      // Ensure we have valid data arrays
      const validSmartBudgets = Array.isArray(smartBudgets) ? smartBudgets : [];
      const validManualBudgets = Array.isArray(manualBudgets) ? manualBudgets : [];
      const validSavingsGoals = Array.isArray(savingsGoals) ? savingsGoals : [];

      // Budget adjustment recommendations
      validSmartBudgets.forEach(budget => {
        if (budget && typeof budget.recommendedAdjustment === 'number' && Math.abs(budget.recommendedAdjustment) > 50) {
          recs.push({
            type: 'budget',
            category: budget.category || 'Unknown',
            title: `Adjust ${budget.category || 'Unknown'} Budget`,
            description: budget.recommendedAdjustment > 0 
              ? `Consider increasing budget by ${formatCurrency(budget.recommendedAdjustment)} based on spending trends`
              : `Consider reducing budget by ${formatCurrency(Math.abs(budget.recommendedAdjustment))} to optimize savings`,
            impact: Math.abs(budget.recommendedAdjustment),
            confidence: budget.confidence || 0.5,
            action: budget.recommendedAdjustment > 0 ? 'increase' : 'decrease'
          });
        }
      });

      // Savings optimization recommendations
      const totalOverspend = validSmartBudgets.reduce((sum, budget) => {
        if (!budget || typeof budget.spent !== 'number' || typeof budget.allocated !== 'number') return sum;
        return sum + Math.max(0, budget.spent - budget.allocated);
      }, 0);

      if (totalOverspend > 100) {
        recs.push({
          type: 'savings',
          title: 'Optimize Spending for Savings Goals',
          description: `You're overspending by ${formatCurrency(totalOverspend)} this month. Reducing discretionary spending could boost your savings rate.`,
          impact: totalOverspend,
          confidence: 0.9,
          action: 'optimize'
        });
      }

      // Category-specific recommendations
      const highSpendingCategories = validSmartBudgets.filter(budget => 
        budget && 
        typeof budget.spent === 'number' && 
        typeof budget.historicalAverage === 'number' &&
        typeof budget.allocated === 'number' &&
        budget.spent > budget.historicalAverage * 1.2 && 
        budget.spent > budget.allocated
      );

      highSpendingCategories.forEach(budget => {
        if (budget && budget.historicalAverage > 0) {
          recs.push({
            type: 'alert',
            category: budget.category || 'Unknown',
            title: `${budget.category || 'Unknown'} Spending Alert`,
            description: `Spending is ${((budget.spent / budget.historicalAverage - 1) * 100).toFixed(0)}% above historical average`,
            impact: budget.spent - budget.historicalAverage,
            confidence: 0.8,
            action: 'review'
          });
        }
      });

      return recs.sort((a, b) => (b.impact || 0) - (a.impact || 0)).slice(0, 6);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }, [smartBudgets, manualBudgets, savingsGoals]);

  // Safe budget comparison with error handling
  const budgetComparisons = React.useMemo(() => {
    try {
      if (!Array.isArray(manualBudgets) || !Array.isArray(smartBudgets)) {
        return [];
      }

      return manualBudgets
        .filter(manualBudget => manualBudget && manualBudget.isActive)
        .map((manualBudget) => {
          const smartBudget = smartBudgets.find(sb => sb && sb.category === manualBudget.category);
          if (!smartBudget) return null;
          
          const difference = (manualBudget.allocatedAmount || 0) - (smartBudget.historicalAverage || 0);
          const percentageDiff = smartBudget.historicalAverage > 0 ? (difference / smartBudget.historicalAverage) * 100 : 0;
          const isSignificantDiff = Math.abs(percentageDiff) > 15;
          
          return {
            ...manualBudget,
            smartBudget,
            difference,
            percentageDiff,
            isSignificantDiff
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error generating budget comparisons:', error);
      return [];
    }
  }, [manualBudgets, smartBudgets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Smart Insights
            </h1>
            <p className="text-gray-600 text-lg">AI-powered recommendations based on your spending patterns</p>
          </div>
        </div>
      </div>

      {/* Manual vs Smart Budget Comparison */}
      {budgetComparisons.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Budget vs Historical Analysis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetComparisons.map((comparison) => {
              if (!comparison) return null;
              
              const { smartBudget, difference, percentageDiff, isSignificantDiff } = comparison;
              
              return (
                <div key={comparison.category} className={`p-4 rounded-lg border-2 ${
                  isSignificantDiff 
                    ? difference > 0 
                      ? 'border-amber-200 bg-amber-50' 
                      : 'border-blue-200 bg-blue-50'
                    : 'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{comparison.category}</h3>
                    {isSignificantDiff ? (
                      <AlertTriangle className={`h-4 w-4 ${difference > 0 ? 'text-amber-600' : 'text-blue-600'}`} />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Budget:</span>
                      <span className="font-medium">{formatCurrency(comparison.allocatedAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">6mo Average:</span>
                      <span className="font-medium">{formatCurrency(smartBudget?.historicalAverage || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Spent:</span>
                      <span className={`font-medium ${(smartBudget?.spent || 0) > (comparison.allocatedAmount || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(smartBudget?.spent || 0)}
                      </span>
                    </div>
                    {isSignificantDiff && (
                      <div className={`text-xs mt-2 p-2 rounded ${
                        difference > 0 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {difference > 0 
                          ? `${Math.abs(percentageDiff).toFixed(0)}% above historical average`
                          : `${Math.abs(percentageDiff).toFixed(0)}% below historical average`
                        }
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Smart Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Smart Recommendations</h2>
        </div>

        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recommendations at this time. Your budget looks well-balanced!</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg mt-1">
                      {rec.type === 'budget' && <Target className="h-4 w-4 text-blue-600" />}
                      {rec.type === 'savings' && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {rec.type === 'alert' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{rec.title}</h3>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                      {getConfidenceLabel(rec.confidence)} Confidence
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Potential Impact: <span className="font-medium text-gray-900">{formatCurrency(rec.impact || 0)}</span>
                  </div>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Budget Trend Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Trends</h3>
        {smartBudgets && smartBudgets.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {smartBudgets.map((budget) => {
              if (!budget || !budget.category) return null;
              
              return (
                <div key={budget.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(budget.trend || 'stable')}
                    <span className="text-sm font-medium text-gray-900">{budget.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">6mo avg</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(budget.historicalAverage || 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Loading spending trends...</p>
          </div>
        )}
      </div>
    </div>
  );
};