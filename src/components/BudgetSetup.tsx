import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Users, DollarSign, Calendar, Settings, Save, ArrowLeft, PieChart } from 'lucide-react';
import { IncomeSource, FixedExpense, BudgetSetup, ManualBudget } from '../types';

interface BudgetSetupProps {
  onSave: (setup: BudgetSetup) => void;
  onBack: () => void;
  initialSetup?: BudgetSetup;
  transactions?: any[];
}

export const BudgetSetupComponent: React.FC<BudgetSetupProps> = ({ onSave, onBack, initialSetup }) => {
  const [selfName, setSelfName] = useState(initialSetup?.selfName || '');
  const [spouseName, setSpouseName] = useState(initialSetup?.spouseName || '');
  initialSetup,
  transactions = []
  const [activeTab, setActiveTab] = useState<'income' | 'expenses' | 'budgets' | 'settings'>('income');
  
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(
    initialSetup?.incomeSources || [
      {
        id: '1',
        name: 'Johno Primary Salary',
        amount: 55000,
        frequency: 'monthly',
        assignedTo: 'self',
        isActive: true
      },
      {
        id: '2',
        name: 'Angela Primary Salary',
        amount: 45000,
        frequency: 'monthly',
        assignedTo: 'spouse',
        isActive: true
      }
    ]
  );

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(
    initialSetup?.fixedExpenses || [
      {
        id: '1',
        name: 'Bond Payment',
        amount: 12000,
        category: 'Housing',
        frequency: 'monthly',
        assignedTo: 'shared',
        splitPercentage: 55, // Johno's share
        dueDate: 1,
        isActive: true
      }
    ]
  );

  const [manualBudgets, setManualBudgets] = useState<ManualBudget[]>(
    initialSetup?.manualBudgets || [
      { id: '1', category: 'Groceries', allocatedAmount: 12000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '2', category: 'Electricity', allocatedAmount: 2500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '3', category: 'Hair/Nails/Beauty', allocatedAmount: 2000, assignedTo: 'self', isActive: true },
      { id: '4', category: 'Pet Expenses', allocatedAmount: 1500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '5', category: 'Eating Out', allocatedAmount: 4000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '6', category: 'Clothing', allocatedAmount: 3000, assignedTo: 'shared', splitPercentage: 50, isActive: true },
      { id: '7', category: 'Golf', allocatedAmount: 2500, assignedTo: 'self', isActive: true },
      { id: '8', category: 'Dischem/Clicks', allocatedAmount: 2000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '9', category: 'Petrol', allocatedAmount: 3500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '10', category: 'Gifts', allocatedAmount: 1500, assignedTo: 'shared', splitPercentage: 50, isActive: true },
      { id: '11', category: 'Travel', allocatedAmount: 5000, assignedTo: 'shared', splitPercentage: 50, isActive: true },
      { id: '12', category: 'Wine', allocatedAmount: 2000, assignedTo: 'shared', splitPercentage: 60, isActive: true },
      { id: '13', category: 'Kids', allocatedAmount: 8000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '14', category: 'House', allocatedAmount: 4000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '15', category: 'Subscriptions', allocatedAmount: 1500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
      { id: '16', category: 'Ad Hoc', allocatedAmount: 5000, assignedTo: 'self', isActive: true }
    ]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const addIncomeSource = () => {
    const newSource: IncomeSource = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      frequency: 'monthly',
      assignedTo: 'self',
      isActive: true
    };
    setIncomeSources([...incomeSources, newSource]);
  };

  const updateIncomeSource = (id: string, updates: Partial<IncomeSource>) => {
    setIncomeSources(sources => 
      sources.map(source => 
        source.id === id ? { ...source, ...updates } : source
      )
    );
  };

  const removeIncomeSource = (id: string) => {
    setIncomeSources(sources => sources.filter(source => source.id !== id));
  };

  const addFixedExpense = () => {
    const newExpense: FixedExpense = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      category: 'Utilities',
      frequency: 'monthly',
      assignedTo: 'shared',
      splitPercentage: 55, // Johno's default share
      dueDate: 1,
      isActive: true
    };
    setFixedExpenses([...fixedExpenses, newExpense]);
  };

  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) => {
    setFixedExpenses(expenses => 
      expenses.map(expense => 
        expense.id === id ? { ...expense, ...updates } : expense
      )
    );
  };

  const removeFixedExpense = (id: string) => {
    setFixedExpenses(expenses => expenses.filter(expense => expense.id !== id));
  };

  const handleSave = () => {
    const setup: BudgetSetup = {
      incomeSources,
      fixedExpenses,
      selfName,
      spouseName,
      defaultSplitPercentage,
      manualBudgets
    };
    onSave(setup);
  };

  const calculateMonthlyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'bi-weekly': return amount * 2.17;
      case 'annual': return amount / 12;
      default: return amount;
    }
  };

  const getTotalIncome = (assignedTo?: 'self' | 'spouse' | 'shared') => {
    return incomeSources
      .filter(source => source.isActive && (!assignedTo || source.assignedTo === assignedTo))
      .reduce((total, source) => total + calculateMonthlyAmount(source.amount, source.frequency), 0);
  };

  const getTotalExpenses = (assignedTo?: 'self' | 'spouse' | 'shared') => {
    return fixedExpenses
      .filter(expense => expense.isActive && (!assignedTo || expense.assignedTo === assignedTo))
      .reduce((total, expense) => {
        const monthlyAmount = calculateMonthlyAmount(expense.amount, expense.frequency);
        if (expense.assignedTo === 'shared' && expense.splitPercentage) {
          return total + (assignedTo === 'self' ? monthlyAmount * (expense.splitPercentage / 100) : 
                         assignedTo === 'spouse' ? monthlyAmount * ((100 - expense.splitPercentage) / 100) : 
                         monthlyAmount);
        }
        return total + monthlyAmount;
      }, 0);
  };

  const expenseCategories = [
    'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
    'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
    'Kids', 'House', 'Subscriptions', 'Ad Hoc'
  ];

  const addManualBudget = () => {
    const newBudget: ManualBudget = {
      id: Date.now().toString(),
      category: 'Ad Hoc',
      allocatedAmount: 0,
      assignedTo: 'shared',
      splitPercentage: 55,
      isActive: true
    };
    setManualBudgets([...manualBudgets, newBudget]);
  };

  const updateManualBudget = (id: string, updates: Partial<ManualBudget>) => {
    setManualBudgets(budgets => 
      budgets.map(budget => 
        budget.id === id ? { ...budget, ...updates } : budget
      )
    );
  };

  const removeManualBudget = (id: string) => {
    setManualBudgets(budgets => budgets.filter(budget => budget.id !== id));
  };

  const getTotalBudgetAllocated = (assignedTo?: 'self' | 'spouse' | 'shared') => {
    return manualBudgets
      .filter(budget => budget.isActive && (!assignedTo || budget.assignedTo === assignedTo))
      .reduce((total, budget) => {
        if (budget.assignedTo === 'shared' && budget.splitPercentage) {
          return total + (assignedTo === 'self' ? budget.allocatedAmount * (budget.splitPercentage / 100) : 
                         assignedTo === 'spouse' ? budget.allocatedAmount * ((100 - budget.splitPercentage) / 100) : 
                         budget.allocatedAmount);
        }
        return total + budget.allocatedAmount;
      }, 0);
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Budget Setup</h1>
                <p className="text-gray-600 mt-1">Configure your income sources and fixed expenses</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Setup
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Budget vs Income Visualization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Budget vs Income Analysis</h2>
            </div>
            <div className="text-sm text-gray-500">Monthly Overview</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual Chart */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Allocation</h3>
                
                {/* Combined Income Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Monthly Income</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(getTotalIncome())}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                    {(() => {
                      const totalIncome = getTotalIncome();
                      const totalFixedExpenses = getTotalExpenses();
                      const totalBudgetAllocated = getTotalBudgetAllocated();
                      const totalAllocated = totalFixedExpenses + totalBudgetAllocated;
                      const remaining = totalIncome - totalAllocated;
                      
                      const fixedPercentage = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0;
                      const budgetPercentage = totalIncome > 0 ? (totalBudgetAllocated / totalIncome) * 100 : 0;
                      const remainingPercentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;
                      
                      return (
                        <>
                          <div 
                            className="bg-red-500 h-4 absolute left-0 top-0"
                            style={{ width: `${Math.min(fixedPercentage, 100)}%` }}
                            title={`Fixed Expenses: ${formatCurrency(totalFixedExpenses)}`}
                          ></div>
                          <div 
                            className="bg-blue-500 h-4 absolute top-0"
                            style={{ 
                              left: `${Math.min(fixedPercentage, 100)}%`,
                              width: `${Math.min(budgetPercentage, 100 - fixedPercentage)}%` 
                            }}
                            title={`Budget Categories: ${formatCurrency(totalBudgetAllocated)}`}
                          ></div>
                          <div 
                            className={`h-4 absolute top-0 ${remaining >= 0 ? 'bg-green-500' : 'bg-red-600'}`}
                            style={{ 
                              left: `${Math.min(fixedPercentage + budgetPercentage, 100)}%`,
                              width: `${Math.max(0, Math.min(Math.abs(remainingPercentage), 100 - fixedPercentage - budgetPercentage))}%` 
                            }}
                            title={`${remaining >= 0 ? 'Available' : 'Over Budget'}: ${formatCurrency(Math.abs(remaining))}`}
                          ></div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                      Fixed Expenses
                    </span>
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                      Budget Categories
                    </span>
                    <span className="flex items-center">
                      <div className={`w-3 h-3 rounded mr-1 ${getTotalIncome() - getTotalExpenses() - getTotalBudgetAllocated() >= 0 ? 'bg-green-500' : 'bg-red-600'}`}></div>
                      {getTotalIncome() - getTotalExpenses() - getTotalBudgetAllocated() >= 0 ? 'Available' : 'Over Budget'}
                    </span>
                  </div>
                </div>

                {/* Individual Breakdown */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Fixed Expenses</span>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(getTotalExpenses())}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTotalIncome() > 0 ? ((getTotalExpenses() / getTotalIncome()) * 100).toFixed(1) : 0}% of income
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Budget Categories</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(getTotalBudgetAllocated())}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTotalIncome() > 0 ? ((getTotalBudgetAllocated() / getTotalIncome()) * 100).toFixed(1) : 0}% of income
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {getTotalIncome() - getTotalExpenses() - getTotalBudgetAllocated() >= 0 ? 'Available' : 'Over Budget'}
                      </span>
                      <span className={`text-sm font-bold ${getTotalIncome() - getTotalExpenses() - getTotalBudgetAllocated() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(getTotalIncome() - getTotalExpenses() - getTotalBudgetAllocated()))}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTotalIncome() > 0 ? (Math.abs((getTotalIncome() - getTotalExpenses() - getTotalBudgetAllocated()) / getTotalIncome()) * 100).toFixed(1) : 0}% of income
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Adjustment Tools */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Budget Adjustments</h3>
                
                {/* Budget Adjustment Presets */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Adjustment Presets</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const adjustment = 0.9; // 10% reduction
                          setManualBudgets(budgets => 
                            budgets.map(budget => ({
                              ...budget,
                              allocatedAmount: Math.round(budget.allocatedAmount * adjustment)
                            }))
                          );
                        }}
                        className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        -10% All Categories
                      </button>
                      <button
                        onClick={() => {
                          const adjustment = 1.1; // 10% increase
                          setManualBudgets(budgets => 
                            budgets.map(budget => ({
                              ...budget,
                              allocatedAmount: Math.round(budget.allocatedAmount * adjustment)
                            }))
                          );
                        }}
                        className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        +10% All Categories
                      </button>
                      <button
                        onClick={() => {
                          const discretionaryCategories = ['Eating Out', 'Golf', 'Wine', 'Ad Hoc', 'Clothing', 'Travel'];
                          setManualBudgets(budgets => 
                            budgets.map(budget => ({
                              ...budget,
                              allocatedAmount: discretionaryCategories.includes(budget.category) 
                                ? Math.round(budget.allocatedAmount * 0.8)
                                : budget.allocatedAmount
                            }))
                          );
                        }}
                        className="px-3 py-2 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                      >
                        -20% Discretionary
                      </button>
                      <button
                        onClick={() => {
                          const essentialCategories = ['Groceries', 'Electricity', 'Pet Expenses', 'Kids'];
                          setManualBudgets(budgets => 
                            budgets.map(budget => ({
                              ...budget,
                              allocatedAmount: essentialCategories.includes(budget.category) 
                                ? Math.round(budget.allocatedAmount * 1.15)
                                : budget.allocatedAmount
                            }))
                          );
                        }}
                        className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        +15% Essentials
                      </button>
                    </div>
                  </div>

                  {/* Balance to Income Button */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Auto-Balance</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Automatically adjust all budget categories to fit within available income
                    </p>
                    <button
                      onClick={() => {
                        const availableForBudgets = getTotalIncome() - getTotalExpenses();
                        const currentBudgetTotal = getTotalBudgetAllocated();
                        
                        if (availableForBudgets > 0 && currentBudgetTotal > 0) {
                          const scaleFactor = availableForBudgets / currentBudgetTotal;
                          setManualBudgets(budgets => 
                            budgets.map(budget => ({
                              ...budget,
                              allocatedAmount: Math.round(budget.allocatedAmount * scaleFactor)
                            }))
                          );
                        }
                      }}
                      disabled={getTotalIncome() - getTotalExpenses() <= 0}
                      className="w-full px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Balance to Available Income
                    </button>
                  </div>

                  {/* Reset to Defaults */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <button
                      onClick={() => {
                        if (confirm('Reset all budget categories to default amounts?')) {
                          setManualBudgets([
                            { id: '1', category: 'Groceries', allocatedAmount: 12000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '2', category: 'Electricity', allocatedAmount: 2500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '3', category: 'Hair/Nails/Beauty', allocatedAmount: 2000, assignedTo: 'self', isActive: true },
                            { id: '4', category: 'Pet Expenses', allocatedAmount: 1500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '5', category: 'Eating Out', allocatedAmount: 4000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '6', category: 'Clothing', allocatedAmount: 3000, assignedTo: 'shared', splitPercentage: 50, isActive: true },
                            { id: '7', category: 'Golf', allocatedAmount: 2500, assignedTo: 'self', isActive: true },
                            { id: '8', category: 'Dischem/Clicks', allocatedAmount: 2000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '9', category: 'Petrol', allocatedAmount: 3500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '10', category: 'Gifts', allocatedAmount: 1500, assignedTo: 'shared', splitPercentage: 50, isActive: true },
                            { id: '11', category: 'Travel', allocatedAmount: 5000, assignedTo: 'shared', splitPercentage: 50, isActive: true },
                            { id: '12', category: 'Wine', allocatedAmount: 2000, assignedTo: 'shared', splitPercentage: 60, isActive: true },
                            { id: '13', category: 'Kids', allocatedAmount: 8000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '14', category: 'House', allocatedAmount: 4000, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '15', category: 'Subscriptions', allocatedAmount: 1500, assignedTo: 'shared', splitPercentage: 55, isActive: true },
                            { id: '16', category: 'Ad Hoc', allocatedAmount: 5000, assignedTo: 'self', isActive: true }
                          ]);
                        }
                      }}
                      className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Budget</h3>
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Income:</span>
                <span className="font-medium text-green-600">{formatCurrency(getTotalIncome('self'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fixed Expenses:</span>
                <span className="font-medium text-red-600">{formatCurrency(getTotalExpenses('self'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Budget Allocated:</span>
                <span className="font-medium text-blue-600">{formatCurrency(getTotalBudgetAllocated('self'))}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Available:</span>
                <span className={`font-bold ${getTotalIncome('self') - getTotalExpenses('self') - getTotalBudgetAllocated('self') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(getTotalIncome('self') - getTotalExpenses('self') - getTotalBudgetAllocated('self'))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{spouseName || 'Spouse'} Budget</h3>
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Income:</span>
                <span className="font-medium text-green-600">{formatCurrency(getTotalIncome('spouse'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fixed Expenses:</span>
                <span className="font-medium text-red-600">{formatCurrency(getTotalExpenses('spouse'))}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Available:</span>
                <span className={`font-bold ${getTotalIncome('spouse') - getTotalExpenses('spouse') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(getTotalIncome('spouse') - getTotalExpenses('spouse'))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Combined Budget</h3>
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Income:</span>
                <span className="font-medium text-green-600">{formatCurrency(getTotalIncome())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Fixed Expenses:</span>
                <span className="font-medium text-red-600">{formatCurrency(getTotalExpenses())}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Available:</span>
                <span className={`font-bold ${getTotalIncome() - getTotalExpenses() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(getTotalIncome() - getTotalExpenses())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('income')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'income'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign className="inline h-4 w-4 mr-2" />
                Income Sources
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'expenses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                Fixed Expenses
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'budgets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <PieChart className="inline h-4 w-4 mr-2" />
                Budget Categories
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="inline h-4 w-4 mr-2" />
                Settings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Income Sources Tab */}
            {activeTab === 'income' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Income Sources</h3>
                  <button
                    onClick={addIncomeSource}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income Source
                  </button>
                </div>

                <div className="space-y-4">
                  {incomeSources.map((source) => (
                    <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={source.name}
                            onChange={(e) => updateIncomeSource(source.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Primary Salary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            value={source.amount}
                            onChange={(e) => updateIncomeSource(source.id, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                          <select
                            value={source.frequency}
                            onChange={(e) => updateIncomeSource(source.id, { frequency: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="bi-weekly">Bi-weekly</option>
                            <option value="weekly">Weekly</option>
                            <option value="annual">Annual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                          <select
                            value={source.assignedTo}
                            onChange={(e) => updateIncomeSource(source.id, { assignedTo: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="self">{selfName || 'You'}</option>
                            <option value="spouse">{spouseName || 'Spouse'}</option>
                            <option value="shared">Shared</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => removeIncomeSource(source.id)}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Monthly equivalent: {formatCurrency(calculateMonthlyAmount(source.amount, source.frequency))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fixed Expenses Tab */}
            {activeTab === 'expenses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Fixed Expenses</h3>
                  <button
                    onClick={addFixedExpense}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fixed Expense
                  </button>
                </div>

                <div className="space-y-4">
                  {fixedExpenses.map((expense) => (
                    <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={expense.name}
                            onChange={(e) => updateFixedExpense(expense.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Bond Payment"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => updateFixedExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={expense.category}
                            onChange={(e) => updateFixedExpense(expense.id, { category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {expenseCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                          <select
                            value={expense.frequency}
                            onChange={(e) => updateFixedExpense(expense.id, { frequency: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="bi-weekly">Bi-weekly</option>
                            <option value="weekly">Weekly</option>
                            <option value="annual">Annual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                          <select
                            value={expense.assignedTo}
                            onChange={(e) => updateFixedExpense(expense.id, { assignedTo: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="self">{selfName || 'You'}</option>
                            <option value="spouse">{spouseName || 'Spouse'}</option>
                            <option value="shared">Shared</option>
                          </select>
                        </div>
                        {expense.assignedTo === 'shared' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={expense.splitPercentage || 50}
                              onChange={(e) => updateFixedExpense(expense.id, { splitPercentage: parseFloat(e.target.value) || 50 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                        <div className="flex items-end">
                          <button
                            onClick={() => removeFixedExpense(expense.id)}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Monthly equivalent: {formatCurrency(calculateMonthlyAmount(expense.amount, expense.frequency))}
                        {expense.assignedTo === 'shared' && expense.splitPercentage && (
                          <span className="ml-4">
                            Your share: {formatCurrency(calculateMonthlyAmount(expense.amount, expense.frequency) * (expense.splitPercentage / 100))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Categories Tab */}
            {activeTab === 'budgets' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Budget Categories</h3>
                  <button
                    onClick={addManualBudget}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Budget Category
                  </button>
                </div>

                <div className="space-y-4">
                  {manualBudgets.map((budget) => (
                    <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={budget.category}
                            onChange={(e) => updateManualBudget(budget.id, { category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {expenseCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget</label>
                          <input
                            type="number"
                            value={budget.allocatedAmount}
                            onChange={(e) => updateManualBudget(budget.id, { allocatedAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                          <select
                            value={budget.assignedTo}
                            onChange={(e) => updateManualBudget(budget.id, { assignedTo: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="self">{selfName || 'You'}</option>
                            <option value="spouse">{spouseName || 'Spouse'}</option>
                            <option value="shared">Shared</option>
                          </select>
                        </div>
                        {budget.assignedTo === 'shared' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={budget.splitPercentage || 50}
                              onChange={(e) => updateManualBudget(budget.id, { splitPercentage: parseFloat(e.target.value) || 50 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                        <div className="flex items-end">
                          <button
                            onClick={() => removeManualBudget(budget.id)}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {budget.assignedTo === 'shared' && budget.splitPercentage && (
                        <div className="mt-2 text-sm text-gray-600">
                          Your share: {formatCurrency(budget.allocatedAmount * (budget.splitPercentage / 100))} | 
                          {spouseName || 'Spouse'}'s share: {formatCurrency(budget.allocatedAmount * ((100 - budget.splitPercentage) / 100))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Budget Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={selfName}
                      onChange={(e) => setSelfName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Name</label>
                    <input
                      type="text"
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter spouse name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Split Percentage (Your share of shared expenses)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={defaultSplitPercentage}
                      onChange={(e) => setDefaultSplitPercentage(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-medium text-gray-900 w-16">{defaultSplitPercentage}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    This will be the default split for new shared expenses. You can adjust individual expenses separately.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Google Sheets Integration</h4>
                  <p className="text-sm text-blue-800">
                    When you add transactions to your Google Sheet, include an "AssignedTo" column with values:
                  </p>
                  <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
                    <li><strong>self</strong> - Expenses assigned to you</li>
                    <li><strong>spouse</strong> - Expenses assigned to your spouse</li>
                    <li><strong>shared</strong> - Shared expenses (will be split based on your settings)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};