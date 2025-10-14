import { useState, useEffect, useCallback } from 'react';
import { Transaction, GoogleSheetsConfig } from '../types';

export const useGoogleSheets = (config: GoogleSheetsConfig | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

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

      // Enhanced debugging
      console.log('=== GOOGLE SHEETS DEBUG INFO ===');
      console.log('Total rows fetched:', rows.length);
      console.log('First 3 rows:', rows.slice(0, 3));
      console.log('Last 3 rows:', rows.slice(-3));
      console.log('Range used:', config.range);
      console.log('Spreadsheet ID:', config.spreadsheetId);
      
      // Check for dates after September 29th
      const datesAfterSept29 = rows.slice(1).filter((row: string[]) => {
        if (!row[0]) return false;
        const dateStr = row[0].trim();
        const date = new Date(dateStr);
        const sept29 = new Date('2024-09-29');
        return date > sept29;
      });
      console.log('Rows with dates after Sept 29, 2024:', datesAfterSept29.length);
      console.log('Sample rows after Sept 29:', datesAfterSept29.slice(0, 5));
      
      setDebugInfo({
        totalRows: rows.length,
        firstRows: rows.slice(0, 3),
        lastRows: rows.slice(-3),
        datesAfterSept29: datesAfterSept29.length,
        sampleAfterSept29: datesAfterSept29.slice(0, 5)
      });

      // Skip header row and parse data
      // Expected columns: Date | Description | Person | Category | Combined/Personal | Amount | ... | Johno Amount | Angela Amount | ... | Payment Method
      // Updated columns: Date | Description | Person | Category | Combined/Personal | Amount | Payment Method | (skip) | Johno Amount | Angela Amount
      const parsedTransactions: Transaction[] = rows.slice(1)
        .filter((row: string[]) => row.length > 0 && row[0]) // Filter out empty rows
        .map((row: string[], index: number) => {
        // Enhanced row processing logging
        const dateStr = row[0]?.trim() || '';
        const date = new Date(dateStr);
        const sept29 = new Date('2024-09-29');
        
        if (date > sept29 && index < 10) {
          console.log(`Processing row ${index + 1} (after Sept 29):`, row);
          console.log(`Date parsed as:`, date);
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
          date: dateStr,
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

      // Enhanced transaction debugging
      console.log('Total parsed transactions:', parsedTransactions.length);
      console.log('First 3 parsed transactions:', parsedTransactions.slice(0, 3));
      console.log('Last 3 parsed transactions:', parsedTransactions.slice(-3));
      
      // Check parsed transactions after Sept 29
      const transactionsAfterSept29 = parsedTransactions.filter(t => {
        const date = new Date(t.date);
        const sept29 = new Date('2024-09-29');
        return date > sept29;
      });
      console.log('Parsed transactions after Sept 29:', transactionsAfterSept29.length);
      console.log('Sample transactions after Sept 29:', transactionsAfterSept29.slice(0, 5));
      console.log('=== END DEBUG INFO ===');
      
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
    refetch: fetchData,
    debugInfo
  };
};