import React from 'react';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { BudgetSetup } from '../types';

interface CreditCardSettlementProps {
  budgetSetup: BudgetSetup;
  onUpdateBudgetSetup: (setup: BudgetSetup) => void;
  creditCardBalance: number;
}

export const CreditCardSettlement: React.FC<CreditCardSettlementProps> = ({
  budgetSetup,
  onUpdateBudgetSetup,
  creditCardBalance
}) => {
  const handleMarkAsSettled = () => {
    const updatedSetup = {
      ...budgetSetup,
      creditCardSettlementDate: new Date().toISOString()
    };
    onUpdateBudgetSetup(updatedSetup);
  };

  const isSettled = creditCardBalance === 0;
  const lastSettlementDate = budgetSetup.creditCardSettlementDate 
    ? new Date(budgetSetup.creditCardSettlementDate).toLocaleDateString()
    : 'Never';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Credit Card Settlement</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Outstanding Balance</p>
            <p className="text-2xl font-bold text-gray-800">
              R{Math.abs(creditCardBalance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Last Settlement</p>
            <p className="text-lg font-medium text-gray-800">{lastSettlementDate}</p>
          </div>
        </div>

        {isSettled ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Credit card is settled</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 font-medium">
                Outstanding balance needs settlement
              </span>
            </div>
            
            <button
              onClick={handleMarkAsSettled}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mark as Settled
            </button>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-4">
          <p>
            This tracks when you've paid off your credit card balance. 
            Marking as settled will reset the outstanding balance calculation.
          </p>
        </div>
      </div>
    </div>
  );
};