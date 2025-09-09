import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Brain, 
  CreditCard, 
  Wallet, 
  Target, 
  Settings, 
  RefreshCw,
  Menu,
  X,
  Home,
  User,
  Users,
  TrendingUp
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { BudgetAnalysis } from './components/BudgetAnalysis';
import { SmartRecommendations } from './components/SmartRecommendations';
import { GoogleSheetsSetup } from './components/GoogleSheetsSetup';
import { BudgetSetupComponent } from './components/BudgetSetup';
import { SavingsGoalsSetup } from './components/SavingsGoalsSetup';
import { IndividualOverview } from './components/IndividualOverview';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { useFinancialData } from './hooks/useFinancialData';
import { useSmartBudgeting } from './hooks/useSmartBudgeting';
import { useCreditCardBalance } from './hooks/useCreditCardBalance';
import { useBankBalance } from './hooks/useBankBalance';
import { CreditCardSettlement } from './components/CreditCardSettlement';
import { BankBalanceOverview } from './components/BankBalanceOverview';
import { generateSampleData, generateSampleSavingsGoals } from './utils/sampleData';
import { GoogleSheetsConfig, SavingsGoal, BudgetSetup as BudgetSetupType } from './types';
import { DateRange, getDefaultDateRange } from './components/DateRangeFilter';

function App() {
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(null);
  const [budgetSetup, setBudgetSetup] = useState<BudgetSetupType | null>(null);
  const [useSampleData, setUseSampleData] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'recommendations' | 'setup' | 'self' | 'spouse' | 'settlement' | 'balances' | 'goals'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('savingsGoals');
    return saved ? JSON.parse(saved) : generateSampleSavingsGoals();
  });
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [isApiLocked, setIsApiLocked] = useState(() => {
    return localStorage.getItem('apiLocked') === 'true';
  });
  
  // Load config and budget setup from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('googleSheetsConfig');
    const savedBudgetSetup = localStorage.getItem('budgetSetup');
    
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    if (savedBudgetSetup) {
      const parsedSetup = JSON.parse(savedBudgetSetup);
      setBudgetSetup(parsedSetup);
    }
  }, []);

  const { transactions, loading, error, lastUpdated, refetch } = useGoogleSheets(config);
  const sampleTransactions = generateSampleData();
  
  const activeTransactions = useSampleData ? sampleTransactions : transactions;
  const { summary, budgets, accounts, monthlyTrends, filteredTransactions } = useFinancialData(activeTransactions, savingsGoals, dateRange, budgetSetup);
  const { smartBudgets, budgetAnalysis } = useSmartBudgeting(activeTransactions, savingsGoals, dateRange);
  const creditCardBalance = useCreditCardBalance(activeTransactions, budgetSetup?.lastCreditCardSettlement || null);
  const bankBalance = useBankBalance(activeTransactions, budgetSetup, dateRange);

  const handleConfigSave = (newConfig: GoogleSheetsConfig) => {
    setConfig(newConfig);
    localStorage.setItem('googleSheetsConfig', JSON.stringify(newConfig));
    // Auto-lock after saving if not already locked
    if (!isApiLocked) {
      setIsApiLocked(true);
      localStorage.setItem('apiLocked', 'true');
    }
  };

  const handleApiUnlock = () => {
    setIsApiLocked(false);
    localStorage.setItem('apiLocked', 'false');
  };

  const handleBudgetSetupSave = (setup: BudgetSetupType) => {
    setBudgetSetup(setup);
    localStorage.setItem('budgetSetup', JSON.stringify(setup));
    setActiveTab('dashboard');
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    ...(budgetSetup ? [
      { id: 'self', label: budgetSetup.selfName, icon: User, color: 'text-blue-600' },
      { id: 'spouse', label: budgetSetup.spouseName, icon: User, color: 'text-purple-600' }
    ] : []),
    { id: 'analysis', label: 'Budget Analysis', icon: BarChart3, color: 'text-green-600' },
    { id: 'recommendations', label: 'Smart Insights', icon: Brain, color: 'text-purple-600' },
    { id: 'settlement', label: 'Credit Card', icon: CreditCard, color: 'text-red-600' },
    { id: 'balances', label: 'Bank Balances', icon: Wallet, color: 'text-emerald-600' },
    { id: 'goals', label: 'Savings Goals', icon: Target, color: 'text-orange-600' },
    { id: 'setup', label: 'Budget Setup', icon: Settings, color: 'text-gray-600' }
  ];

  const handleCreditCardSettlement = () => {
    if (budgetSetup) {
      const updatedSetup = {
        ...budgetSetup,
        lastCreditCardSettlement: new Date().toISOString()
      };
      setBudgetSetup(updatedSetup);
      localStorage.setItem('budgetSetup', JSON.stringify(updatedSetup));
    }
  };

  const handleUpdateOpeningBalances = (johnoBalance: number, angelaBalance: number) => {
    if (budgetSetup) {
      const updatedSetup = {
        ...budgetSetup,
        johnoOpeningBalance: johnoBalance,
        angelaOpeningBalance: angelaBalance,
        balanceAsOfDate: new Date().toISOString(),
        zeroBalances: false
      };
      setBudgetSetup(updatedSetup);
      localStorage.setItem('budgetSetup', JSON.stringify(updatedSetup));
    }
  };

  const handleZeroBalances = () => {
    if (budgetSetup && confirm('This will zero out your bank balances. You can then enter your current actual balances. Continue?')) {
      const updatedSetup = {
        ...budgetSetup,
        zeroBalances: true,
        balanceAsOfDate: new Date().toISOString()
      };
      setBudgetSetup(updatedSetup);
      localStorage.setItem('budgetSetup', JSON.stringify(updatedSetup));
    }
  };
  const handleSavingsGoalsSave = (goals: SavingsGoal[]) => {
    setSavingsGoals(goals);
    localStorage.setItem('savingsGoals', JSON.stringify(goals));
  };

  const handleUseSampleData = () => {
    setUseSampleData(true);
  };

  // Show budget setup if no setup exists
  if (!budgetSetup && activeTab === 'setup') {
    return (
      <BudgetSetupComponent
        onSave={handleBudgetSetupSave}
        onBack={() => setActiveTab('dashboard')}
        initialSetup={budgetSetup || undefined}
      />
    );
  }

  // Show Google Sheets setup if no config and not using sample data
  if (!config && !useSampleData) {
    return (
      <div>
        <GoogleSheetsSetup 
          onConfigSave={handleConfigSave} 
          existingConfig={config}
          isLocked={isApiLocked}
          onUnlock={handleApiUnlock}
          onFullDataImport={() => {
            // Reload the page to refresh all data after import
            window.location.reload();
          }}
        />
        <div className="fixed bottom-4 right-4">
          <button
            onClick={handleUseSampleData}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-lg"
          >
            Try with Sample Data
          </button>
        </div>
      </div>
    );
  }

  if (error && !useSampleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => setConfig(null)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Update Configuration
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
            >
              Refresh App
            </button>
            <button
              onClick={handleUseSampleData}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
            >
              Use Sample Data Instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex-shrink-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BudgetFlow</h1>
                <p className="text-xs text-blue-100">Financial Analytics</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className={`font-medium ${isActive ? 'text-blue-700' : ''}`}>{item.label}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}
                </button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
            >
              <RefreshCw className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh Data</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                  localStorage.removeItem('googleSheetsConfig');
                  localStorage.removeItem('budgetSetup');
                  localStorage.removeItem('savingsGoals');
                  localStorage.removeItem('apiLocked');
                  setConfig(null);
                  setBudgetSetup(null);
                  setSavingsGoals([]);
                  setUseSampleData(false);
                  setIsApiLocked(false);
                  setActiveTab('dashboard');
                }
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
            >
              <X className="h-5 w-5 text-red-400 group-hover:text-red-600" />
              <span className="font-medium">Reset All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            summary={summary}
            budgets={budgets}
            accounts={accounts}
            transactions={filteredTransactions}
            monthlyTrends={monthlyTrends}
            lastUpdated={lastUpdated}
            onRefresh={refetch}
            loading={loading}
            budgetSetup={budgetSetup}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        )}

        {activeTab === 'self' && budgetSetup && (
          <IndividualOverview
            person="self"
            budgetSetup={budgetSetup}
            transactions={filteredTransactions}
            budgets={budgets}
            savingsGoals={savingsGoals}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        )}

        {activeTab === 'spouse' && budgetSetup && (
          <IndividualOverview
            person="spouse"
            budgetSetup={budgetSetup}
            transactions={filteredTransactions}
            budgets={budgets}
            savingsGoals={savingsGoals}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        )}

        {activeTab === 'analysis' && (
          <BudgetAnalysis
            budgetAnalysis={budgetAnalysis}
            savingsGoals={savingsGoals}
            budgetSetup={budgetSetup}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        )}

        {activeTab === 'recommendations' && (
          <SmartRecommendations
            smartBudgets={smartBudgets}
            savingsGoals={savingsGoals}
            manualBudgets={budgets}
            budgetSetup={budgetSetup}
          />
        )}

        {activeTab === 'settlement' && (
          <CreditCardSettlement
            creditCardBalance={creditCardBalance}
            onSettlement={handleCreditCardSettlement}
          />
        )}

        {activeTab === 'balances' && budgetSetup && (
          <BankBalanceOverview
            bankBalance={bankBalance}
            budgetSetup={budgetSetup}
            onUpdateOpeningBalances={handleUpdateOpeningBalances}
            onZeroBalances={handleZeroBalances}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        )}

        {activeTab === 'setup' && (
          <BudgetSetupComponent
            onSave={handleBudgetSetupSave}
            onBack={() => setActiveTab('dashboard')}
            initialSetup={budgetSetup || undefined}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsGoalsSetup
            savingsGoals={savingsGoals}
            onSave={handleSavingsGoalsSave}
            onBack={() => setActiveTab('dashboard')}
            budgetSetup={budgetSetup}
          />
        )}
      </div>
      </div>
    </div>
  );
}

export default App;