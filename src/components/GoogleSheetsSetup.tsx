import React, { useState } from 'react';
import { Sheet, Key, Database, AlertCircle, Download, Upload, Copy, Check, Settings, CheckCircle } from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

interface GoogleSheetsSetupProps {
  onConfigSave: (config: GoogleSheetsConfig) => void;
  existingConfig?: GoogleSheetsConfig | null;
  onFullDataImport?: (data: any) => void;
  isLocked?: boolean;
  onUnlock?: () => void;
  preserveData?: boolean;
}

export const GoogleSheetsSetup: React.FC<GoogleSheetsSetupProps> = ({ 
  onConfigSave, 
  existingConfig, 
  onFullDataImport,
  isLocked = false,
  onUnlock,
  preserveData = false
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState(existingConfig?.spreadsheetId || '');
  const [apiKey, setApiKey] = useState(isLocked ? '••••••••••••••••' : (existingConfig?.apiKey || ''));
  const [range, setRange] = useState(existingConfig?.range || 'Sheet1!A:F');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [showApiExport, setShowApiExport] = useState(false);
  const [showApiImport, setShowApiImport] = useState(false);
  const [showFullExport, setShowFullExport] = useState(false);
  const [showFullImport, setShowFullImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [apiCopied, setApiCopied] = useState(false);
  const [fullCopied, setFullCopied] = useState(false);
  const [importError, setImportError] = useState('');

  const handleUnlock = () => {
    // Simple password check - you can make this more secure
    if (unlockPassword === 'admin123' || unlockPassword === 'unlock') {
      if (onUnlock) {
        onUnlock();
      }
      setShowUnlockForm(false);
      setUnlockPassword('');
    } else {
      setImportError('Incorrect password. Try "admin123" or "unlock"');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setImportError('Settings are locked. Please unlock to make changes.');
      return;
    }
    onConfigSave({ spreadsheetId, apiKey, range });
  };

  const handleApiExport = () => {
    const config = { spreadsheetId, apiKey, range };
    const configString = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configString);
    setApiCopied(true);
    setTimeout(() => setApiCopied(false), 2000);
  };

  const handleApiImport = () => {
    try {
      const config = JSON.parse(importText);
      if (config.spreadsheetId && config.apiKey && config.range) {
        setSpreadsheetId(config.spreadsheetId);
        setApiKey(config.apiKey);
        setRange(config.range);
        setShowApiImport(false);
        setImportText('');
        setImportError('');
      } else {
        setImportError('Invalid configuration format. Missing required fields.');
      }
    } catch (error) {
      setImportError('Invalid JSON format. Please check your configuration.');
    }
  };

  const handleFullExport = () => {
    const fullData = {
      googleSheetsConfig: { spreadsheetId, apiKey, range },
      budgetSetup: localStorage.getItem('budgetSetup') ? JSON.parse(localStorage.getItem('budgetSetup')!) : null,
      savingsGoals: localStorage.getItem('savingsGoals') ? JSON.parse(localStorage.getItem('savingsGoals')!) : null,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const dataString = JSON.stringify(fullData, null, 2);
    navigator.clipboard.writeText(dataString);
    setFullCopied(true);
    setTimeout(() => setFullCopied(false), 2000);
  };

  const handleFullImport = () => {
    try {
      const fullData = JSON.parse(importText);
      
      // Validate the structure
      if (!fullData.googleSheetsConfig || !fullData.version) {
        setImportError('Invalid full data format. This doesn\'t appear to be a complete BudgetFlow export.');
        return;
      }

      // Import Google Sheets config
      if (fullData.googleSheetsConfig.spreadsheetId && fullData.googleSheetsConfig.apiKey) {
        setSpreadsheetId(fullData.googleSheetsConfig.spreadsheetId);
        setApiKey(fullData.googleSheetsConfig.apiKey);
        setRange(fullData.googleSheetsConfig.range || 'Sheet1!A:F');
      }

      // Import other data to localStorage
      if (fullData.budgetSetup) {
        localStorage.setItem('budgetSetup', JSON.stringify(fullData.budgetSetup));
      }
      if (fullData.savingsGoals) {
        localStorage.setItem('savingsGoals', JSON.stringify(fullData.savingsGoals));
      }

      // Notify parent component to refresh data
      if (onFullDataImport) {
        onFullDataImport(fullData);
      }

      setShowFullImport(false);
      setImportText('');
      setImportError('');
      
      // Show success message
      alert('All data imported successfully! The page will refresh to load your settings.');
      window.location.reload();
    } catch (error) {
      setImportError('Invalid JSON format. Please check your complete data export.');
    }
  };

  const downloadApiConfig = () => {
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

  const downloadFullData = () => {
    const fullData = {
      googleSheetsConfig: { spreadsheetId, apiKey, range },
      budgetSetup: localStorage.getItem('budgetSetup') ? JSON.parse(localStorage.getItem('budgetSetup')!) : null,
      savingsGoals: localStorage.getItem('savingsGoals') ? JSON.parse(localStorage.getItem('savingsGoals')!) : null,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const dataString = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budgetflow-complete-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        {/* Data Preservation Notice */}
        {preserveData && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Safe Update Mode</p>
                <p className="text-xs text-green-800">Your budget setup and savings goals will be preserved</p>
              </div>
            </div>
          </div>
        )}

        {/* Lock Status Indicator */}
        {isLocked && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-amber-100 rounded">
                <Key className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">Settings Locked</p>
                <p className="text-xs text-amber-800">API settings are protected from changes</p>
              </div>
            </div>
            <button
              onClick={() => setShowUnlockForm(!showUnlockForm)}
              className="mt-2 text-xs text-amber-700 hover:text-amber-800 underline"
            >
              Unlock Settings
            </button>
          </div>
        )}

        {/* Unlock Form */}
        {showUnlockForm && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Unlock Settings</h3>
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              placeholder="Enter unlock password"
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUnlock}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Unlock
              </button>
              <button
                onClick={() => {
                  setShowUnlockForm(false);
                  setUnlockPassword('');
                  setImportError('');
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Sheet className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {existingConfig ? (preserveData ? 'Update API Settings' : 'Update Google Sheets') : 'Connect Google Sheets'}
          </h1>
          <p className="text-gray-600 mt-2">
            {preserveData ? 'Update your API configuration safely' : 'Link your spreadsheet to start tracking your finances'}
          </p>
        </div>

        {/* Export/Import Buttons - Split into API and Full Data */}
        {(spreadsheetId || apiKey) && !isLocked && (
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowApiExport(!showApiExport)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Key className="h-4 w-4 mr-2" />
                Export API Only
              </button>
              <button
                type="button"
                onClick={() => setShowApiImport(!showApiImport)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Key className="h-4 w-4 mr-2" />
                Import API Only
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFullExport(!showFullExport)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Export All Data
              </button>
              <button
                type="button"
                onClick={() => setShowFullImport(!showFullImport)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Import All Data
              </button>
            </div>
          </div>
        )}

        {/* API Export Section */}
        {showApiExport && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Export API Configuration</h3>
            <p className="text-sm text-blue-800 mb-3">
              Save only your Google Sheets API settings
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleApiExport}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                {apiCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {apiCopied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={downloadApiConfig}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </button>
            </div>
          </div>
        )}

        {/* API Import Section */}
        {showApiImport && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 mb-2">Import API Configuration</h3>
            <p className="text-sm text-green-800 mb-3">
              Paste your exported API configuration here
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
              onClick={handleApiImport}
              disabled={!importText.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Import Configuration
            </button>
          </div>
        )}

        {/* Full Data Export Section */}
        {showFullExport && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-2">Export Complete Data</h3>
            <p className="text-sm text-purple-800 mb-3">
              Save ALL your BudgetFlow data including API settings, budget setup, savings goals, and settlement history
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleFullExport}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
              >
                {fullCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {fullCopied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={downloadFullData}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Complete Backup
              </button>
            </div>
          </div>
        )}

        {/* Full Data Import Section */}
        {showFullImport && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-sm font-medium text-orange-900 mb-2">Import Complete Data</h3>
            <p className="text-sm text-orange-800 mb-3">
              Restore ALL your BudgetFlow data from a complete backup
            </p>
            <div className="mb-3 p-3 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
              <strong>⚠️ Warning:</strong> This will overwrite all your current data including budget setup, savings goals, and settlement history.
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-3"
              rows={4}
              placeholder="Paste your complete BudgetFlow backup JSON here..."
            />
            {importError && (
              <p className="text-sm text-red-600 mb-3">{importError}</p>
            )}
            <button
              onClick={handleFullImport}
              disabled={!importText.trim()}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Import Complete Data
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="inline h-4 w-4 mr-1" />
              Google Sheets API Key
              {isLocked && <span className="text-xs text-amber-600 ml-2">(Protected)</span>}
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => !isLocked && setApiKey(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Enter your API key"
              readOnly={isLocked}
              required
            />
          </div>

          <div>
            <label htmlFor="spreadsheetId" className="block text-sm font-medium text-gray-700 mb-2">
              <Database className="inline h-4 w-4 mr-1" />
              Spreadsheet ID
              {isLocked && <span className="text-xs text-amber-600 ml-2">(Protected)</span>}
            </label>
            <input
              type="text"
              id="spreadsheetId"
              value={spreadsheetId}
              onChange={(e) => !isLocked && setSpreadsheetId(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              readOnly={isLocked}
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
              onChange={(e) => !isLocked && setRange(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Sheet1!A:F"
              readOnly={isLocked}
              required
            />
          </div>

          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{importError}</p>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
              isLocked 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
            disabled={isLocked}
          >
            {isLocked ? 'Settings Locked' : (existingConfig ? 'Update Configuration' : 'Connect Spreadsheet')}
          </button>
        </form>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Data Management:</p>
              <div className="mb-3">
                <p className="font-medium text-amber-900">Export Options:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>API Only:</strong> Just Google Sheets connection settings</li>
                  <li><strong>All Data:</strong> Complete backup including budget setup, savings goals, settlement history</li>
                </ul>
              </div>
              <p className="font-medium mb-1">Google Sheets Setup Instructions:</p>
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