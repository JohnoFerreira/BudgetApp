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
  const bankBalance = useMemo(() => {
    console.log('=== BANK BALANCE DEBUG ===');
    console.log('Transactions:', transactions.length);
    console.log('Budget Setup:', !!budgetSetup);
    console.log('Date Range:', dateRange);
    
    if (!budgetSetup) {
      console.log('No budget setup - returning empty data');
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

    // Use date range if provided, otherwise use current pay cycle
    const getPayCycleStart = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      if (day >= 25) {
        return new Date(year, month, 25);
      } else {
        return new Date(year, month - 1, 25);
      }
    };

    const getPayCycleEnd = (startDate: Date) => {
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      return new Date(year, month + 1, 24);
    };

    const currentDate = new Date();
    const filterStart = dateRange ? new Date(dateRange.startDate) : getPayCycleStart(currentDate);
    const filterEnd = dateRange ? new Date(dateRange.endDate) : getPayCycleEnd(getPayCycleStart(currentDate));

    console.log('Filter dates:', { filterStart, filterEnd });

    // Filter transactions for the selected period
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: filterStart, end: filterEnd });
    });

    console.log('Filtered transactions:', filteredTransactions.length);

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

    console.log('Johno transactions:', johnoTransactions.length);

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

    console.log('Johno fixed expenses:', johnoFixedExpenses);

    // Johno's cash expenses (excluding credit card)
    const johnoCashExpenses = filteredTransactions
      .filter(t => 
        t.type === 'expense' && 
        t.paymentMethod !== 'credit_card' && 
        !t.account?.toLowerCase().includes('credit') &&
        !t.description?.toLowerCase().includes('credit') &&
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

    console.log('Johno cash expenses:', johnoCashExpenses);

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
                 (transaction.paymentMethod === 'credit_card' ||
                  transaction.account?.toLowerCase().includes('credit') ||
                  transaction.description?.toLowerCase().includes('credit'));
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
    
    // Calculate what the closing balance would be
    const johnoCalculatedBalance = johnoOpeningBalance + johnoIncome - johnoFixedExpenses - johnoCashExpenses - johnoCreditCardSettlement;
    
    // If user wants to zero balances, adjust opening balance to make closing balance zero
    const johnoAdjustedOpening = budgetSetup.zeroBalances ? -johnoIncome + johnoFixedExpenses + johnoCashExpenses + johnoCreditCardSettlement : johnoOpeningBalance;
    const johnoClosingBalance = budgetSetup.zeroBalances ? 0 : johnoCalculatedBalance;

    console.log('Johno balances:', { opening: johnoAdjustedOpening, closing: johnoClosingBalance });

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
        !t.account?.toLowerCase().includes('credit') &&
        !t.description?.toLowerCase().includes('credit') &&
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
    
    // Calculate what the closing balance would be
    const angelaCalculatedBalance = angelaOpeningBalance + angelaIncome - angelaFixedExpenses - angelaCashExpenses - angelaCreditCardSettlement;
    
    // If user wants to zero balances, adjust opening balance to make closing balance zero
    const angelaAdjustedOpening = budgetSetup.zeroBalances ? -angelaIncome + angelaFixedExpenses + angelaCashExpenses + angelaCreditCardSettlement : angelaOpeningBalance;
    const angelaClosingBalance = budgetSetup.zeroBalances ? 0 : angelaCalculatedBalance;

    console.log('Angela balances:', { opening: angelaAdjustedOpening, closing: angelaClosingBalance });
    console.log('Combined closing balance:', johnoClosingBalance + angelaClosingBalance);
    console.log('=== END BANK BALANCE DEBUG ===');

    return {
      johno: {
        openingBalance: johnoAdjustedOpening,
        totalIncome: johnoIncome,
        fixedExpenses: johnoFixedExpenses,
        cashExpenses: johnoCashExpenses,
        creditCardSettlements: johnoCreditCardSettlement,
        closingBalance: johnoClosingBalance,
        transactions: johnoTransactions
      },
      angela: {
        openingBalance: angelaAdjustedOpening,
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
  }, [transactions, budgetSetup, dateRange?.startDate, dateRange?.endDate]);

  return bankBalance;
};