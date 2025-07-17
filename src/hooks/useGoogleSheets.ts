import { useState, useEffect, useCallback } from 'react';
import { Transaction, GoogleSheetsConfig } from '../types';

export const useGoogleSheets = (config: GoogleSheetsConfig | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}?key=${config.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Sheets');
      }

      const data = await response.json();
      const rows = data.values || [];

      // Log the first few rows to help debug
      console.log('Google Sheets data (first 3 rows):', rows.slice(0, 3));
      // Skip header row and parse data
      // Expected columns: Date | Description | Person | Category | Combined/Personal | Amount | ... | Johno Amount | Angela Amount | ... | Payment Method
      // Updated columns: Date | Description | Person | Category | Combined/Personal | Amount | Payment Method | (skip) | Johno Amount | Angela Amount
      const parsedTransactions: Transaction[] = rows.slice(1)
        .filter((row: string[]) => row.length > 0 && row[0]) // Filter out empty rows
        .map((row: string[], index: number) => {
        // Log each row being processed
        if (index < 5) {
          console.log(`Processing row ${index + 1}:`, row);
        }
        
        const totalAmount = parseFloat(row[5]) || 0;
        const johnoAmount = parseFloat(row[8]) || 0; // Column I (index 8)
        const angelaAmount = parseFloat(row[9]) || 0; // Column J (index 9)
        const isPersonal = row[4]?.toLowerCase() === 'personal';
        const isCombined = row[4]?.toLowerCase() === 'combined';
        const paymentMethod = row[6]?.toLowerCase() === 'credit card' ? 'credit_card' : 'cash'; // Column G (index 6)
        
        // Calculate split percentage for combined expenses
        let splitPercentage: number | undefined;
        if (isCombined && totalAmount > 0 && johnoAmount > 0) {
          splitPercentage = (johnoAmount / totalAmount) * 100;
        }

        // Determine transaction type (income vs expense)
        const transactionType: 'income' | 'expense' = totalAmount > 0 ? 'expense' : 'income';
        const absoluteAmount = Math.abs(totalAmount);

        return {
          id: `${index}`,
          date: row[0]?.trim() || '',
          description: row[1]?.trim() || '',
          amount: absoluteAmount,
          category: row[3]?.trim() || 'Other',
          type: transactionType,
          account: 'Main Account', // You can adjust this if you have account info elsewhere
          assignedTo: isPersonal ? 
                     (row[2]?.toLowerCase().trim().includes('johno') ? 'self' : 'spouse') : 
                     'shared',
          splitPercentage,
          paymentMethod
        };
      })
      .filter(transaction => transaction.date && transaction.description); // Filter out invalid transactions

      console.log('Parsed transactions (first 3):', parsedTransactions.slice(0, 3));
      setTransactions(parsedTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Google Sheets fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
    
    // Set up polling for live updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    transactions,
    loading,
    error,
    lastUpdated,
    refetch: fetchData
  };
};