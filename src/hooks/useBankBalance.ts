import { useMemo } from 'react';
import { Transaction, BudgetSetup } from '../types';
import { isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from '../components/DateRangeFilter';
import { useCreditCardBalance } from './useCreditCardBalance';

export interface PersonBankBalance {
  openingBalance: number;
  totalIncome: number;
  fixedExpenses: number;
  cashExpenses: number;
  creditCardSettlements: number;
  closingBalance: number;
  transactions: Transaction[];
}

export interface BankBalanceData {
  johno: PersonBankBalance;
  angela: PersonBankBalance;
  combined: {
    totalClosingBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
}

export const useBankBalance = (
  transactions: Transaction[],
  budgetSetup: BudgetSetup | null,
  dateRange?: DateRange
): BankBalanceData => {
  // Get credit card balance data to calculate settlements
  const creditCardBalance = useCreditCardBalance(transactions, budgetSetup?.lastCreditCardSettlement || null);
  
  const bankBalance = useMemo(() => {
    if (!budgetSetup) {
      return {
        johno: {
          openingBalance: 0,
          totalIncome: 0,
          fixedExpenses: 0,
          cashExpenses: 0,
          creditCardSettlements: 0,
          closingBalance: 0,
          transactions: []
        },
        angela: {
          openingBalance: 0,
          totalIncome: 0,
          fixedExpenses: 0,
          cashExpenses: 0,
          creditCardSettlements: 0,
          closingBalance: 0,
          transactions: []
        },
        combined: {
          totalClosingBalance: 0,
          totalIncome: 0,
          totalExpenses: 0
        }
      };
    }

    // Use date range if provided, otherwise use current month
    const filterStart = dateRange ? new Date(dateRange.startDate) : startOfMonth(new Date());
    const filterEnd = dateRange ? new Date(dateRange.endDate) : endOfMonth(new Date());

    // Filter transactions for the selected period
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: filterStart, end: filterEnd });
    });

    // Calculate monthly amounts for fixed expenses
    const calculateMonthlyAmount = (amount: number, frequency: string) => {
      switch (frequency) {
        case 'weekly': return amount * 4.33;
        case 'bi-weekly': return amount * 2.17;
        case 'annual': return amount / 12;
        default: return amount;
      }
    };

    // Calculate for Johno (self)
    const johnoTransactions = filteredTransactions.filter(t => 
      t.assignedTo === 'self' || (t.assignedTo === 'shared' && t.type === 'expense')
    );

    const johnoIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.assignedTo === 'self')
      .reduce((sum, t) => sum + t.amount, 0);

    // Johno's fixed expenses (personal + share of shared)
    const johnoFixedExpenses = budgetSetup.fixedExpenses
      .filter(expense => expense.isActive)
      .reduce((sum, expense) => {
        const monthlyAmount = calculateMonthlyAmount(expense.amount, expense.frequency);
        if (expense.assignedTo === 'self') {
          return sum + monthlyAmount;
        } else if (expense.assignedTo === 'shared') {
          const johnoShare = expense.splitPercentage || budgetSetup.defaultSplitPercentage;
          return sum + (monthlyAmount * (johnoShare / 100));
        }
        return sum;
      }, 0);

    // Johno's cash expenses (excluding credit card)
    const johnoCashExpenses = filteredTransactions
      .filter(t => 
        t.type === 'expense' && 
        t.paymentMethod !== 'credit_card' &&
        (t.assignedTo === 'self' || t.assignedTo === 'shared')
      )
      .reduce((sum, t) => {
        if (t.assignedTo === 'shared' && t.splitPercentage) {
          return sum + (t.amount * (t.splitPercentage / 100));
        } else if (t.assignedTo === 'shared') {
          return sum + (t.amount * (budgetSetup.defaultSplitPercentage / 100));
        }
        return sum + t.amount;
      }, 0);

    // Calculate credit card settlements (only if there was a settlement in the selected period)
    let johnoCreditCardSettlement = 0;
    let angelaCreditCardSettlement = 0;
    
    // If there was a settlement date and it falls within our date range, include the settlement amounts
    if (budgetSetup.lastCreditCardSettlement) {
      const settlementDate = new Date(budgetSetup.lastCreditCardSettlement);
      if (isWithinInterval(settlementDate, { start: filterStart, end: filterEnd })) {
        // Calculate what each person owed at the time of settlement
        const settlementTransactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate <= settlementDate && 
                 transaction.type === 'expense' && 
                 transaction.paymentMethod === 'credit_card';
        });

        settlementTransactions.forEach(transaction => {
          if (transaction.assignedTo === 'self') {
            johnoCreditCardSettlement += transaction.amount;
          } else if (transaction.assignedTo === 'spouse') {
            angelaCreditCardSettlement += transaction.amount;
          } else if (transaction.assignedTo === 'shared') {
            const johnoShare = transaction.splitPercentage || budgetSetup.defaultSplitPercentage;
            const angelaShare = 100 - johnoShare;
            
            johnoCreditCardSettlement += (transaction.amount * johnoShare) / 100;
            angelaCreditCardSettlement += (transaction.amount * angelaShare) / 100;
          }
        });
      }
    }

    const johnoOpeningBalance = budgetSetup.johnoOpeningBalance || 0;
    const johnoClosingBalance = johnoOpeningBalance + johnoIncome - johnoFixedExpenses - johnoCashExpenses - johnoCreditCardSettlement;

    // Calculate for Angela (spouse)
    const angelaTransactions = filteredTransactions.filter(t => 
      t.assignedTo === 'spouse' || (t.assignedTo === 'shared' && t.type === 'expense')
    );

    const angelaIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.assignedTo === 'spouse')
      .reduce((sum, t) => sum + t.amount, 0);

    // Angela's fixed expenses (personal + share of shared)
    const angelaFixedExpenses = budgetSetup.fixedExpenses
      .filter(expense => expense.isActive)
      .reduce((sum, expense) => {
        const monthlyAmount = calculateMonthlyAmount(expense.amount, expense.frequency);
        if (expense.assignedTo === 'spouse') {
          return sum + monthlyAmount;
        } else if (expense.assignedTo === 'shared') {
          const angelaShare = 100 - (expense.splitPercentage || budgetSetup.defaultSplitPercentage);
          return sum + (monthlyAmount * (angelaShare / 100));
        }
        return sum;
      }, 0);

    // Angela's cash expenses (excluding credit card)
    const angelaCashExpenses = filteredTransactions
      .filter(t => 
        t.type === 'expense' && 
        t.paymentMethod !== 'credit_card' &&
        (t.assignedTo === 'spouse' || t.assignedTo === 'shared')
      )
      .reduce((sum, t) => {
        if (t.assignedTo === 'shared' && t.splitPercentage) {
          const angelaShare = 100 - t.splitPercentage;
          return sum + (t.amount * (angelaShare / 100));
        } else if (t.assignedTo === 'shared') {
          const angelaShare = 100 - budgetSetup.defaultSplitPercentage;
          return sum + (t.amount * (angelaShare / 100));
        }
        return sum + t.amount;
      }, 0);

    const angelaOpeningBalance = budgetSetup.angelaOpeningBalance || 0;
    const angelaClosingBalance = angelaOpeningBalance + angelaIncome - angelaFixedExpenses - angelaCashExpenses - angelaCreditCardSettlement;

    return {
      johno: {
        openingBalance: johnoOpeningBalance,
        totalIncome: johnoIncome,
        fixedExpenses: johnoFixedExpenses,
        cashExpenses: johnoCashExpenses,
        creditCardSettlements: johnoCreditCardSettlement,
        closingBalance: johnoClosingBalance,
        transactions: johnoTransactions
      },
      angela: {
        openingBalance: angelaOpeningBalance,
        totalIncome: angelaIncome,
        fixedExpenses: angelaFixedExpenses,
        cashExpenses: angelaCashExpenses,
        creditCardSettlements: angelaCreditCardSettlement,
        closingBalance: angelaClosingBalance,
        transactions: angelaTransactions
      },
      combined: {
        totalClosingBalance: johnoClosingBalance + angelaClosingBalance,
        totalIncome: johnoIncome + angelaIncome,
        totalExpenses: johnoFixedExpenses + angelaFixedExpenses + johnoCashExpenses + angelaCashExpenses + johnoCreditCardSettlement + angelaCreditCardSettlement
      }
    };
  }, [transactions, budgetSetup, dateRange, creditCardBalance]);

  return bankBalance;
};