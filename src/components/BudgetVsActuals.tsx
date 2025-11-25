import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, TrendingDown, User, Users, Target, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Budget, BudgetSetup, Transaction } from '../types';
import { DateRange, DateRangeFilter, getDefaultDateRange } from './DateRangeFilter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface BudgetVsActualsProps {
  budgets: Budget[];
  budgetSetup: BudgetSetup;
  transactions: Transaction[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
}

export const BudgetVsActuals: React.FC<BudgetVsActualsProps> = ({
  budgets,
  budgetSetup,
  transactions,
  dateRange = getDefaultDateRange(),
  onDateRangeChange
}) => {
  const [viewMode, setViewMode] = useState<'combined' | 'individual'>('combined');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Filter budgets by assignment
  const selfBudgets = budgets.filter(budget => budget.assignedTo === 'self');
  const spouseBudgets = budgets.filter(budget => budget.assignedTo === 'spouse');
  const sharedBudgets = budgets.filter(budget => budget.assignedTo === 'shared' || !budget.assignedTo);

  // Calculate totals for each person
  const calculateTotals = (budgetList: Budget[]) => {
    return budgetList.reduce((acc, budget) => ({
      allocated: acc.allocated + budget.allocated,
      spent: acc.spent + budget.spent,
      remaining: acc.remaining + (budget.allocated - budget.spent)
    }), { allocated: 0, spent: 0, remaining: 0 });
  };

  const selfTotals = calculateTotals(selfBudgets);
  const spouseTotals = calculateTotals(spouseBudgets);
  const sharedTotals = calculateTotals(sharedBudgets);
  const combinedTotals = calculateTotals(budgets);

  // Prepare chart data
  const chartData = viewMode === 'combined' 
    ? budgets.map(budget => ({
        category: budget.category,
        allocated: budget.allocated,
        spent: budget.spent,
        remaining: Math.max(0, budget.allocated - budget.spent),
        overBudget: Math.max(0, budget.spent - budget.allocated),
        assignedTo: budget.assignedTo || 'shared'
      }))
    : [
        ...selfBudgets.map(budget => ({
          category: `${budget.category} (${budgetSetup.selfName})`,
          allocated: budget.allocated,
          spent: budget.spent,
          remaining: Math.max(0, budget.allocated - budget.spent),
          overBudget: Math.max(0, budget.spent - budget.allocated),
          assignedTo: 'self'
        })),
        ...spouseBudgets.map(budget => ({
          category: `${budget.category} (${budgetSetup.spouseName})`,
          allocated: budget.allocated,
          spent: budget.spent,
          remaining: Math.max(0, budget.allocated - budget.spent),
          overBudget: Math.max(0, budget.spent - budget.allocated),
          assignedTo: 'spouse'
        })),
        ...sharedBudgets.map(budget => ({
          category: `${budget.category} (Shared)`,
          allocated: budget.allocated,
          spent: budget.spent,
          remaining: Math.max(0, budget.allocated - budget.spent),
          overBudget: Math.max(0, budget.spent - budget.allocated),
          assignedTo: 'shared'
        }))
      ];

  const pieData = [
    { name: budgetSetup.selfName, value: selfTotals.spent, color: '#3B82F6' },
    { name: budgetSetup.spouseName, value: spouseTotals.spent, color: '#8B5CF6' },
    { name: 'Shared', value: sharedTotals.spent, color: '#10B981' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusIcon = (budget: Budget) => {
    const percentage = (budget.spent / budget.allocated) * 100;
    if (percentage > 100) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (percentage > 80) return <TrendingUp className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (budget: Budget) => {
    const percentage = (budget.spent / budget.allocated) * 100;
    if (percentage > 100) return 'border-red-200 bg-red-50';
    if (percentage > 80) return 'border-amber-200 bg-amber-50';
    return 'border-green-200 bg-green-50';
  };

  const getPersonColor = (assignedTo: string) => {
    switch (assignedTo) {
      case 'self': return 'text-blue-600 bg-blue-100';
      case 'spouse': return 'text-purple-600 bg-purple-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Budget vs Actuals</h1>
              <p className="text-gray-600 mt-1">
                Compare budgeted amounts with actual spending for {dateRange.label}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {onDateRangeChange && (
              <DateRangeFilter selectedRange={dateRange} onRangeChange={onDateRangeChange} />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('combined')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'combined'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Combined View
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'individual'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Individual View
            </button>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2 inline" />
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartType === 'pie'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PieChart className="h-4 w-4 mr-2 inline" />
              Pie Chart
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Individual Summaries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{budgetSetup.selfName}</h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              selfTotals.spent > selfTotals.allocated ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
            }`}>
              {((selfTotals.spent / selfTotals.allocated) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Budgeted:</span>
              <span className="font-medium">{formatCurrency(selfTotals.allocated)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spent:</span>
              <span className={`font-medium ${selfTotals.spent > selfTotals.allocated ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(selfTotals.spent)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-medium ${selfTotals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(selfTotals.remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">{budgetSetup.spouseName}</h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              spouseTotals.spent > spouseTotals.allocated ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
            }`}>
              {((spouseTotals.spent / spouseTotals.allocated) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Budgeted:</span>
              <span className="font-medium">{formatCurrency(spouseTotals.allocated)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spent:</span>
              <span className={`font-medium ${spouseTotals.spent > spouseTotals.allocated ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(spouseTotals.spent)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-medium ${spouseTotals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(spouseTotals.remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Shared</h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              sharedTotals.spent > sharedTotals.allocated ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
            }`}>
              {((sharedTotals.spent / sharedTotals.allocated) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Budgeted:</span>
              <span className="font-medium">{formatCurrency(sharedTotals.allocated)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spent:</span>
              <span className={`font-medium ${sharedTotals.spent > sharedTotals.allocated ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(sharedTotals.spent)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-medium ${sharedTotals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(sharedTotals.remaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Combined</h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              combinedTotals.spent > combinedTotals.allocated ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
            }`}>
              {((combinedTotals.spent / combinedTotals.allocated) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Budgeted:</span>
              <span className="font-medium">{formatCurrency(combinedTotals.allocated)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spent:</span>
              <span className={`font-medium ${combinedTotals.spent > combinedTotals.allocated ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(combinedTotals.spent)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-medium ${combinedTotals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(combinedTotals.remaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {chartType === 'bar' ? 'Budget vs Actual Spending' : 'Spending Distribution'}
          </h2>
          <div className="text-sm text-gray-500">
            {chartType === 'bar' ? 'Blue: Budgeted, Orange: Spent, Red: Over Budget' : 'Total Spending by Person'}
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="allocated" fill="#3B82F6" name="Budgeted" />
                <Bar dataKey="spent" fill="#F59E0B" name="Spent" />
                <Bar dataKey="overBudget" fill="#EF4444" name="Over Budget" />
              </BarChart>
            ) : (
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </RechartsPieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Budget List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Budget Breakdown</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.allocated) * 100;
            const isOverBudget = budget.spent > budget.allocated;
            
            return (
              <div key={budget.category} className={`p-4 rounded-lg border-2 ${getStatusColor(budget)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(budget)}
                    <h3 className="font-medium text-gray-900">{budget.category}</h3>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonColor(budget.assignedTo || 'shared')}`}>
                    {budget.assignedTo === 'self' ? budgetSetup.selfName :
                     budget.assignedTo === 'spouse' ? budgetSetup.spouseName : 'Shared'}
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budgeted:</span>
                    <span className="font-medium">{formatCurrency(budget.allocated)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent:</span>
                    <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(budget.spent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budget.allocated - budget.spent)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  {percentage.toFixed(1)}% used
                  {isOverBudget && (
                    <span className="text-red-600 block">
                      Over by {formatCurrency(budget.spent - budget.allocated)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};