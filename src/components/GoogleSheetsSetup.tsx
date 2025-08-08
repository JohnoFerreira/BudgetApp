import React, { useState } from 'react';
import { Sheet, Key, Database, AlertCircle, Download, Upload, Copy, Check } from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

interface GoogleSheetsSetupProps {
  onConfigSave: (config: GoogleSheetsConfig) => void;
  existingConfig?: GoogleSheetsConfig | null;
}

export const GoogleSheetsSetup: React.FC<GoogleSheetsSetupProps> = ({ onConfigSave, existingConfig }) => {
  const [spreadsheetId, setSpreadsheetId] = useState(existingConfig?.spreadsheetId || '');
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [range, setRange] = useState(existingConfig?.range || 'Sheet1!A:F');
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigSave({ spreadsheetId, apiKey, range });
  };

  const handleExport = () => {
    const config = { spreadsheetId, apiKey, range };
    const configString = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const config = JSON.parse(importText);
      if (config.spreadsheetId && config.apiKey && config.range) {
        setSpreadsheetId(config.spreadsheetId);
        setApiKey(config.apiKey);
        setRange(config.range);
        setShowImport(false);
        setImportText('');
        setImportError('');
      } else {
        setImportError('Invalid configuration format. Missing required fields.');
      }
    } catch (error) {
      setImportError('Invalid JSON format. Please check your configuration.');
    }
  };

  const downloadConfig = () => {
    const config = { spreadsheetId, apiKey, range };
    const configString = JSON.stringify(config, null, 2);
    const blob = new Blob([configString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budgetflow-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Sheet className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {existingConfig ? 'Update Google Sheets' : 'Connect Google Sheets'}
          </h1>
          <p className="text-gray-600 mt-2">Link your spreadsheet to start tracking your finances</p>
        </div>

        {/* Export/Import Buttons */}
        {(spreadsheetId || apiKey) && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setShowExport(!showExport)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowImport(!showImport)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
          </div>
        )}

        {/* Export Section */}
        {showExport && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Export Configuration</h3>
            <p className="text-sm text-blue-800 mb-3">
              Save your configuration to use on other devices
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={downloadConfig}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </button>
            </div>
          </div>
        )}

        {/* Import Section */}
        {showImport && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 mb-2">Import Configuration</h3>
            <p className="text-sm text-green-800 mb-3">
              Paste your exported configuration here
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-3"
              rows={4}
              placeholder="Paste your configuration JSON here..."
            />
            {importError && (
              <p className="text-sm text-red-600 mb-3">{importError}</p>
            )}
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Import Configuration
            </button>
          </div>
        )}

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
            {existingConfig ? 'Update Configuration' : 'Connect Spreadsheet'}
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
                <li>Expected format: Date | Description | Person | Category | Combined/Personal | Amount | Payment Method | (skip) | Johno Amount | Angela Amount</li>
                <li><strong>Person column:</strong> "Johno" or "Angela"</li>
                <li><strong>Combined/Personal column:</strong> "Combined" or "Personal"</li>
                <li><strong>Payment Method column:</strong> "Cash" or "Credit Card"</li>
                <li><strong>Amount columns:</strong> Johno Amount (column I), Angela Amount (column J)</li>
                <li>For combined expenses, individual amounts will be used to calculate split percentages</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};