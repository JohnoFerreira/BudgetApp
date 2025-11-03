import { useMemo } from 'react';
import { Transaction, CreditCardBalance } from '../types';

export const useCreditCardBalance = (
  transactions: Transaction[], 
  lastSettlementDate: string | null
): CreditCardBalance => {
  
  const creditCardBalance = useMemo(() => {
    console.log('=== CREDIT CARD BALANCE DEBUG ===');
    console.log('Last settlement date:', lastSettlementDate);
    console.log('Total transactions:', transactions.length);
    
    // Filter transactions since last settlement
    const settlementDate = lastSettlementDate ? new Date(lastSettlementDate) : new Date('1900-01-01');
    
    console.log('Settlement date for filtering:', settlementDate.toISOString());
    
    const transactionsSinceSettlement = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const isAfterSettlement = transactionDate > settlementDate;
      
      // Check if it's a credit card transaction
      const isCreditCard = transaction.type === 'expense' && (
        transaction.paymentMethod === 'credit_card' || 
        transaction.account?.toLowerCase().includes('credit') ||
        transaction.description?.toLowerCase().includes('credit card') ||
        transaction.description?.toLowerCase().includes('creditcard')
      );
      
      if (isAfterSettlement && isCreditCard) {
        console.log('Credit card transaction found:', {
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod,
          account: transaction.account
        });
      }
      
      return isAfterSettlement && isCreditCard;
    });
    
    console.log('Credit card transactions since settlement:', transactionsSinceSettlement.length);
    console.log('Sample transactions:', transactionsSinceSettlement.slice(0, 3));

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
    
    console.log('Credit card balances:', {
      johnoOwes: Math.round(johnoOwes * 100) / 100,
      angelaOwes: Math.round(angelaOwes * 100) / 100,
      total: Math.round((johnoOwes + angelaOwes) * 100) / 100
    });
    console.log('=== END CREDIT CARD DEBUG ===');

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