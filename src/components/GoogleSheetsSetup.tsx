import React, { useState } from 'react';
import { Sheet, Key, Database, AlertCircle } from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

interface GoogleSheetsSetupProps {
  onConfigSave: (config: GoogleSheetsConfig) => void;
}

export const GoogleSheetsSetup: React.FC<GoogleSheetsSetupProps> = ({ onConfigSave }) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [range, setRange] = useState('Sheet1!A:F');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigSave({ spreadsheetId, apiKey, range });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Sheet className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connect Google Sheets</h1>
          <p className="text-gray-600 mt-2">Link your spreadsheet to start tracking your finances</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="inline h-4 w-4 mr-1" />
              Google Sheets API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter your API key"
              required
            />
          </div>

          <div>
            <label htmlFor="spreadsheetId" className="block text-sm font-medium text-gray-700 mb-2">
              <Database className="inline h-4 w-4 mr-1" />
              Spreadsheet ID
            </label>
            <input
              type="text"
              id="spreadsheetId"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              required
            />
          </div>

          <div>
            <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-2">
              Data Range
            </label>
            <input
              type="text"
              id="range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Sheet1!A:F"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Connect Spreadsheet
          </button>
        </form>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enable Google Sheets API in Google Cloud Console</li>
                <li>Create an API key and restrict it to Sheets API</li>
                <li>Share your spreadsheet with "Anyone with the link"</li>
                <li>Expected format: Date | Description | Person | Category | Combined/Personal | Amount | ... | Angela Amount | Johno Amount | ... | Payment Method</li>
                <li>Person column should contain "Johno" for Johno's expenses and "Angela" for Angela's expenses</li>
                <li>Combined/Personal column should contain "Combined" or "Personal"</li>
                <li>Payment Method column should contain "Cash" or "Credit Card"</li>
                <li>For combined expenses, the system will use Johno's 55% / Angela's 45% split</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};