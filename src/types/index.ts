export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  account: string;
  assignedTo?: 'self' | 'spouse' | 'shared';
  splitPercentage?: number;
  paymentMethod?: 'cash' | 'credit_card';
}

export interface Budget {
  category: string;
  allocated: number;
  spent: number;
  color: string;
  historicalAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendedAdjustment: number;
  confidence: number;
  assignedTo?: 'self' | 'spouse' | 'shared';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
  category?: string;
  assignedTo?: 'self' | 'spouse' | 'shared';
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit';
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  totalBudget: number;
  budgetUsed: number;
  savingsRate: number;
  totalSavingsGoals: number;
  projectedSavings: number;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  range: string;
}

export interface BudgetAnalysis {
  category: string;
  actual: number;
  budgeted: number;
  variance: number;
  variancePercentage: number;
  historicalAverage: number;
  recommendedBudget: number;
  trend: 'over' | 'under' | 'on-track';
  impactOnGoals: number;
  assignedTo?: 'self' | 'spouse' | 'shared';
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'bi-weekly' | 'annual';
  assignedTo: 'self' | 'spouse' | 'shared';
  isActive: boolean;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'weekly' | 'bi-weekly' | 'annual';
  assignedTo: 'self' | 'spouse' | 'shared';
  splitPercentage?: number;
  dueDate?: number; // Day of month
  isActive: boolean;
}

export interface BudgetSetup {
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  selfName: string;
  spouseName: string;
  defaultSplitPercentage: number;
  lastCreditCardSettlement?: string; // ISO date string
  johnoOpeningBalance?: number;
  angelaOpeningBalance?: number;
  balanceAsOfDate?: string; // ISO date string
  manualBudgets?: ManualBudget[];
}

export interface ManualBudget {
  id: string;
  category: string;
  allocatedAmount: number;
  assignedTo: 'self' | 'spouse' | 'shared';
  splitPercentage?: number;
  isActive: boolean;
}

export interface CreditCardBalance {
  angelaOwes: number;
  johnoOwes: number;
  totalOutstanding: number;
  lastSettlementDate: string | null;
  transactionsSinceSettlement: Transaction[];
}