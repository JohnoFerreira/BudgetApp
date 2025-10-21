import { useMemo } from 'react';
import { Transaction, CreditCardBalance } from '../types';

export const useCreditCardBalance = (
  transactions: Transaction[], 
  lastSettlementDate: string | null
): CreditCardBalance => {
  
  const creditCardBalance = useMemo(() => {
    // Filter transactions since last settlement
    const settlementDate = lastSettlementDate ? new Date(lastSettlementDate) : new Date('1900-01-01');
    
    const transactionsSinceSettlement = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate > settlementDate && 
             transaction.type === 'expense' && 
             (transaction.paymentMethod === 'credit_card' || 
              transaction.account?.toLowerCase().includes('credit') ||
              transaction.description?.toLowerCase().includes('credit'));
    });

    // Calculate what each person owes
    let johnoOwes = 0;
    let angelaOwes = 0;

    transactionsSinceSettlement.forEach(transaction => {
      if (transaction.assignedTo === 'self') {
        // Johno's personal expense
        johnoOwes += transaction.amount;
      } else if (transaction.assignedTo === 'spouse') {
        // Angela's personal expense
        angelaOwes += transaction.amount;
      } else if (transaction.assignedTo === 'shared') {
        // Shared expense - split according to percentage
        const johnoShare = transaction.splitPercentage || 55; // Default 55% for Johno
        const angelaShare = 100 - johnoShare;
        
        johnoOwes += (transaction.amount * johnoShare) / 100;
        angelaOwes += (transaction.amount * angelaShare) / 100;
      }
    });

    return {
      johnoOwes: Math.round(johnoOwes * 100) / 100,
      angelaOwes: Math.round(angelaOwes * 100) / 100, // Round to 2 decimal places
      totalOutstanding: Math.round((johnoOwes + angelaOwes) * 100) / 100,
      lastSettlementDate,
      transactionsSinceSettlement
    };
  }, [transactions, lastSettlementDate]);

  return creditCardBalance;
};