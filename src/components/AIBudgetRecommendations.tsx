import React, { useState, useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, CheckCircle, AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { Transaction, BudgetSetup, ManualBudget } from '../types';
import { isWithinInterval, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface AIBudgetRecommendationsProps {
  transactions: Transaction[];
  budgetSetup: BudgetSetup | null;
  onUpdateBudgets: (budgets: ManualBudget[]) => void;
  onBack: () => void;
}

interface BudgetRecommendation {
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  sixMonthAverage: number;
  confidence: number;
  reasoning: string;
  assignedTo: 'self' | 'spouse' | 'shared';
  change: number;
  changePercentage: number;
}

export const AIBudgetRecommendations: React.FC<AIBudgetRecommendationsProps> = ({
  transactions,
  budgetSetup,
  onUpdateBudgets,
  onBack
}) => {
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
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

  const generateRecommendations = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const categories = [
      'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
      'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
      'Kids', 'House', 'Subscriptions', 'Ad Hoc'
    ];

    const currentDate = new Date();
    const sixMonthsAgo = subMonths(currentDate, 6);

    const newRecommendations: BudgetRecommendation[] = [];

    categories.forEach(category => {
      // Calculate 6-month historical spending
      const historicalTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.category === category && 
               t.type === 'expense' &&
               transactionDate >= sixMonthsAgo;
      });

      if (historicalTransactions.length === 0) return;

      // Calculate monthly averages
      const monthlyTotals: number[] = [];
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(currentDate, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthlySpending = historicalTransactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
          })
          .reduce((sum, t) => {
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

      const sixMonthAverage = monthlyTotals.reduce((sum, total) => sum + total, 0) / 6;
      
      // Calculate confidence based on consistency
      const variance = monthlyTotals.reduce((sum, total) => sum + Math.pow(total - sixMonthAverage, 2), 0) / 6;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = sixMonthAverage > 0 ? standardDeviation / sixMonthAverage : 1;
      const confidence = Math.max(0.3, Math.min(1, 1 - coefficientOfVariation));

      // Get current budget
      const currentBudget = budgetSetup?.manualBudgets?.find(b => b.category === category)?.allocatedAmount || 0;

      // Smart budget calculation
      let recommendedBudget = sixMonthAverage;
      let reasoning = '';

      // Essential categories get 10% buffer
      const essentialCategories = ['Groceries', 'Electricity', 'Kids', 'Pet Expenses', 'House', 'Subscriptions'];
      if (essentialCategories.includes(category)) {
        recommendedBudget = sixMonthAverage * 1.1;
        reasoning = 'Essential category with 10% safety buffer added';
      }
      // Discretionary categories get slight reduction for savings
      else if (['Eating Out', 'Golf', 'Wine', 'Travel', 'Gifts'].includes(category)) {
        recommendedBudget = sixMonthAverage * 0.95;
        reasoning = 'Discretionary spending with 5% reduction for savings optimization';
      }
      // Regular categories
      else {
        recommendedBudget = sixMonthAverage * 1.05;
        reasoning = 'Based on 6-month average with 5% buffer';
      }

      // Seasonal adjustments
      if (category === 'Electricity') {
        const currentMonth = currentDate.getMonth();
        if (currentMonth >= 10 || currentMonth <= 2) { // Summer months in SA
          recommendedBudget *= 1.2;
          reasoning += ' + 20% summer adjustment';
        }
      }

      // Smart assignment
      let assignedTo: 'self' | 'spouse' | 'shared' = 'shared';
      if (['Hair/Nails/Beauty', 'Golf', 'Ad Hoc'].includes(category)) {
        assignedTo = 'self';
      } else if (['Kids', 'Groceries', 'Electricity', 'Pet Expenses', 'House'].includes(category)) {
        assignedTo = 'shared';
      }

      const change = recommendedBudget - currentBudget;
      const changePercentage = currentBudget > 0 ? (change / currentBudget) * 100 : 0;

      // Only recommend if there's a significant difference (>5% or >R100)
      if (Math.abs(changePercentage) > 5 || Math.abs(change) > 100) {
        newRecommendations.push({
          category,
          currentBudget,
          recommendedBudget: Math.round(recommendedBudget),
          sixMonthAverage: Math.round(sixMonthAverage),
          confidence,
          reasoning,
          assignedTo,
          change,
          changePercentage
        });
      }
    });

    // Sort by impact (absolute change amount)
    newRecommendations.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    setRecommendations(newRecommendations);
    setIsGenerating(false);
  };

  const applyRecommendation = (recommendation: BudgetRecommendation) => {
    if (!budgetSetup) return;

    const updatedBudgets = [...(budgetSetup.manualBudgets || [])];
    const existingIndex = updatedBudgets.findIndex(b => b.category === recommendation.category);

    const newBudget: ManualBudget = {
      id: existingIndex >= 0 ? updatedBudgets[existingIndex].id : Date.now().toString(),
      category: recommendation.category,
      allocatedAmount: recommendation.recommendedBudget,
      assignedTo: recommendation.assignedTo,
      isActive: true
    };

    if (existingIndex >= 0) {
      updatedBudgets[existingIndex] = newBudget;
    } else {
      updatedBudgets.push(newBudget);
    }

    onUpdateBudgets(updatedBudgets);
    setAppliedRecommendations(prev => new Set([...prev, recommendation.category]));
  };

  const applyAllRecommendations = () => {
    if (!budgetSetup) return;

    const updatedBudgets = [...(budgetSetup.manualBudgets || [])];

    recommendations.forEach(recommendation => {
      const existingIndex = updatedBudgets.findIndex(b => b.category === recommendation.category);

      const newBudget: ManualBudget = {
        id: existingIndex >= 0 ? updatedBudgets[existingIndex].id : Date.now().toString(),
        category: recommendation.category,
        allocatedAmount: recommendation.recommendedBudget,
        assignedTo: recommendation.assignedTo,
        isActive: true
      };

      if (existingIndex >= 0) {
        updatedBudgets[existingIndex] = newBudget;
      } else {
        updatedBudgets.push(newBudget);
      }
    });

    onUpdateBudgets(updatedBudgets);
    setAppliedRecommendations(new Set(recommendations.map(r => r.category)));
  };

  const totalImpact = recommendations.reduce((sum, rec) => sum + rec.change, 0);
  const unappliedRecommendations = recommendations.filter(rec => !appliedRecommendations.has(rec.category));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">AI Budget Recommendations</h1>
                  <p className="text-gray-600 mt-1">Intelligent budget suggestions based on your spending patterns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Generate Recommendations Section */}
        {recommendations.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Brain className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Optimize Your Budget?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our AI will analyze your last 6 months of spending data to provide intelligent budget recommendations 
              tailored to your actual spending patterns and financial goals.
            </p>
            <button
              onClick={generateRecommendations}
              disabled={isGenerating}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 font-medium text-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Analyzing Your Spending...
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5 mr-3" />
                  Generate AI Recommendations
                </>
              )}
            </button>
          </div>
        )}

        {/* Recommendations Summary */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recommendation Summary</h2>
                <p className="text-gray-600">Based on 6 months of spending analysis</p>
              </div>
              {unappliedRecommendations.length > 0 && (
                <button
                  onClick={applyAllRecommendations}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 font-medium"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply All Recommendations
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {recommendations.length}
                </div>
                <p className="text-sm text-gray-600">Categories Analyzed</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${totalImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(totalImpact)}
                </div>
                <p className="text-sm text-gray-600">Total Budget Impact</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length * 100)}%
                </div>
                <p className="text-sm text-gray-600">Average Confidence</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations List */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            {recommendations.map((recommendation) => {
              const isApplied = appliedRecommendations.has(recommendation.category);
              const isIncrease = recommendation.change > 0;

              return (
                <div key={recommendation.category} className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
                  isApplied ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:shadow-md'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${
                          isIncrease ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {isIncrease ? (
                            <TrendingUp className="h-6 w-6 text-red-600" />
                          ) : (
                            <TrendingDown className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{recommendation.category}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                              {getConfidenceLabel(recommendation.confidence)} Confidence
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              recommendation.assignedTo === 'self' ? 'text-blue-600 bg-blue-100' :
                              recommendation.assignedTo === 'spouse' ? 'text-purple-600 bg-purple-100' :
                              'text-green-600 bg-green-100'
                            }`}>
                              {recommendation.assignedTo === 'self' ? budgetSetup?.selfName || 'You' :
                               recommendation.assignedTo === 'spouse' ? budgetSetup?.spouseName || 'Spouse' :
                               'Shared'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{recommendation.reasoning}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Current Budget</p>
                              <p className="font-medium text-gray-900">{formatCurrency(recommendation.currentBudget)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Recommended</p>
                              <p className={`font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(recommendation.recommendedBudget)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">6mo Average</p>
                              <p className="font-medium text-gray-900">{formatCurrency(recommendation.sixMonthAverage)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Change</p>
                              <p className={`font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                                {isIncrease ? '+' : ''}{formatCurrency(recommendation.change)}
                                <span className="text-xs ml-1">
                                  ({recommendation.changePercentage > 0 ? '+' : ''}{recommendation.changePercentage.toFixed(1)}%)
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isApplied ? (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Applied</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => applyRecommendation(recommendation)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 text-sm font-medium"
                          >
                            <Target className="h-4 w-4 mr-2" />
                            Apply This Recommendation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Generate New Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setRecommendations([]);
                setAppliedRecommendations(new Set());
              }}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Brain className="h-4 w-4 mr-2" />
              Generate New Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};