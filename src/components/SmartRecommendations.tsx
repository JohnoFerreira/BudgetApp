import React from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { Budget, SavingsGoal } from '../types';

interface SmartRecommendationsProps {
  smartBudgets: Budget[];
  savingsGoals: SavingsGoal[];
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ 
  smartBudgets, 
  savingsGoals 
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

  // Generate smart recommendations
  const recommendations = React.useMemo(() => {
    const recs = [];

    // Budget adjustment recommendations
    smartBudgets.forEach(budget => {
      if (Math.abs(budget.recommendedAdjustment) > 50) {
        recs.push({
          type: 'budget',
          category: budget.category,
          title: `Adjust ${budget.category} Budget`,
          description: budget.recommendedAdjustment > 0 
            ? `Consider increasing budget by ${formatCurrency(budget.recommendedAdjustment)} based on spending trends`
            : `Consider reducing budget by ${formatCurrency(Math.abs(budget.recommendedAdjustment))} to optimize savings`,
          impact: Math.abs(budget.recommendedAdjustment),
          confidence: budget.confidence,
          action: budget.recommendedAdjustment > 0 ? 'increase' : 'decrease'
        });
      }
    });

    // Savings optimization recommendations
    const totalOverspend = smartBudgets.reduce((sum, budget) => {
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
    const highSpendingCategories = smartBudgets.filter(budget => 
      budget.spent > budget.historicalAverage * 1.2 && budget.spent > budget.allocated
    );

    highSpendingCategories.forEach(budget => {
      recs.push({
        type: 'alert',
        category: budget.category,
        title: `${budget.category} Spending Alert`,
        description: `Spending is ${((budget.spent / budget.historicalAverage - 1) * 100).toFixed(0)}% above historical average`,
        impact: budget.spent - budget.historicalAverage,
        confidence: 0.8,
        action: 'review'
      });
    });

    return recs.sort((a, b) => b.impact - a.impact).slice(0, 6);
  }, [smartBudgets]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Smart Recommendations</h2>
          <p className="text-sm text-gray-600">AI-powered insights based on your spending patterns</p>
        </div>
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
                    {rec.type === 'alert' && <TrendingUp className="h-4 w-4 text-amber-600" />}
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
                  Potential Impact: <span className="font-medium text-gray-900">{formatCurrency(rec.impact)}</span>
                </div>
                <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Apply Suggestion
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Budget Trend Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Category Trends</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {smartBudgets.map((budget) => (
            <div key={budget.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {getTrendIcon(budget.trend)}
                <span className="text-sm font-medium text-gray-900">{budget.category}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">6mo avg</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(budget.historicalAverage)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};