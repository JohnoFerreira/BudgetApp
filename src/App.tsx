import React, { useState, useEffect } from 'react';
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
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('savingsGoals');
    return saved ? JSON.parse(saved) : generateSampleSavingsGoals();
  });
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  
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
  const { summary, budgets, accounts, monthlyTrends, filteredTransactions } = useFinancialData(activeTransactions, savingsGoals, dateRange);
  const { smartBudgets, budgetAnalysis } = useSmartBudgeting(activeTransactions, savingsGoals, dateRange);
  const creditCardBalance = useCreditCardBalance(activeTransactions, budgetSetup?.lastCreditCardSettlement || null);
  const bankBalance = useBankBalance(activeTransactions, budgetSetup, dateRange);

  const handleConfigSave = (newConfig: GoogleSheetsConfig) => {
    setConfig(newConfig);
    localStorage.setItem('googleSheetsConfig', JSON.stringify(newConfig));
  };

  const handleBudgetSetupSave = (setup: BudgetSetupType) => {
    setBudgetSetup(setup);
    localStorage.setItem('budgetSetup', JSON.stringify(setup));
    setActiveTab('dashboard');
  };

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
              onClick={() => setActiveTab('balances')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === 'balances'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bank Balances
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BudgetFlow</h1>
              <p className="text-gray-600 mt-1">Smart Financial Management Dashboard</p>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              {budgetSetup && (
                <>
                  <button
                    onClick={() => setActiveTab('self')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      activeTab === 'self'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {budgetSetup.selfName}
                  </button>
                  <button
                    onClick={() => setActiveTab('spouse')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      activeTab === 'spouse'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {budgetSetup.spouseName}
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === 'analysis'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Budget Analysis
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === 'recommendations'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Smart Insights
              </button>
              <button
                onClick={() => setActiveTab('settlement')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === 'settlement'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Credit Card
              </button>
              <button
                onClick={() => setActiveTab('balances')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === 'balances'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Bank Balances
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === 'goals'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Savings Goals
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === 'setup'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Budget Setup
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('googleSheetsConfig');
                  localStorage.removeItem('budgetSetup');
                  localStorage.removeItem('savingsGoals');
                  setConfig(null);
                  setBudgetSetup(null);
                  setSavingsGoals([]);
                  // Reset to initial state
                  setUseSampleData(false);
                  setActiveTab('dashboard');
                }}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 rounded-lg transition-colors duration-200"
              >
                Reset All Data
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            summary={summary}
            budgets={budgets}
            accounts={accounts}
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
  );
}

export default App;