import React, { useState } from 'react';
import { Plus, Trash2, Target, Calendar, DollarSign, Save, ArrowLeft, User, Users } from 'lucide-react';
import { SavingsGoal, BudgetSetup } from '../types';

interface SavingsGoalsSetupProps {
  savingsGoals: SavingsGoal[];
  onSave: (goals: SavingsGoal[]) => void;
  onBack: () => void;
  budgetSetup?: BudgetSetup | null;
}

export const SavingsGoalsSetup: React.FC<SavingsGoalsSetupProps> = ({
  savingsGoals,
  onSave,
  onBack,
  budgetSetup
}) => {
  const [goals, setGoals] = useState<SavingsGoal[]>(savingsGoals);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const addGoal = () => {
    const newGoal: SavingsGoal = {
      id: Date.now().toString(),
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      priority: 'medium',
      monthlyContribution: 0,
      category: 'General',
      assignedTo: 'shared'
    };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const handleSave = () => {
    onSave(goals);
    onBack();
  };

  const calculateMonthsRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const months = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return months;
  };

  const calculateRequiredMonthly = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const months = calculateMonthsRemaining(goal.targetDate);
    return Math.max(0, remaining / months);
  };

  const getTotalMonthlyContributions = () => {
    return goals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);
  };

  const categories = [
    'Emergency', 'Travel', 'Transportation', 'Home', 'Education', 
    'Investment', 'Retirement', 'Health', 'General', 'Entertainment'
  ];

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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
                <p className="text-gray-600 mt-1">Set up and manage your financial savings targets</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Goals
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(goals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
              </div>
              <p className="text-sm text-gray-600">Total Target Amount</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
              </div>
              <p className="text-sm text-gray-600">Current Savings</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(getTotalMonthlyContributions())}
              </div>
              <p className="text-sm text-gray-600">Monthly Contributions</p>
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Savings Goals</h2>
            <button
              onClick={addGoal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </button>
          </div>

          <div className="space-y-6">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const requiredMonthly = calculateRequiredMonthly(goal);
              const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
              const isOnTrack = goal.monthlyContribution >= requiredMonthly;

              return (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                        <input
                          type="text"
                          value={goal.name}
                          onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Emergency Fund"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                          <input
                            type="number"
                            value={goal.targetAmount}
                            onChange={(e) => updateGoal(goal.id, { targetAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
                          <input
                            type="number"
                            value={goal.currentAmount}
                            onChange={(e) => updateGoal(goal.id, { currentAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                          <input
                            type="date"
                            value={goal.targetDate}
                            onChange={(e) => updateGoal(goal.id, { targetDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution</label>
                          <input
                            type="number"
                            value={goal.monthlyContribution}
                            onChange={(e) => updateGoal(goal.id, { monthlyContribution: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Settings & Progress */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={goal.category || 'General'}
                            onChange={(e) => updateGoal(goal.id, { category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={goal.priority}
                            onChange={(e) => updateGoal(goal.id, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </div>

                      {budgetSetup && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                          <select
                            value={goal.assignedTo || 'shared'}
                            onChange={(e) => updateGoal(goal.id, { assignedTo: e.target.value as 'self' | 'spouse' | 'shared' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="self">{budgetSetup.selfName}</option>
                            <option value="spouse">{budgetSetup.spouseName}</option>
                            <option value="shared">Shared</option>
                          </select>
                        </div>
                      )}

                      {/* Progress Display */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Required Monthly</p>
                            <p className={`font-medium ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(requiredMonthly)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Months Remaining</p>
                            <p className="font-medium text-gray-900">{monthsRemaining}</p>
                          </div>
                        </div>
                        {!isOnTrack && requiredMonthly > goal.monthlyContribution && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                            Increase contribution by {formatCurrency(requiredMonthly - goal.monthlyContribution)} to stay on track
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Goal
                    </button>
                  </div>
                </div>
              );
            })}

            {goals.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Savings Goals Yet</h3>
                <p className="text-gray-600 mb-4">Start by adding your first savings goal to track your progress.</p>
                <button
                  onClick={addGoal}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Goal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};