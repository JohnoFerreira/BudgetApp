import { Transaction, SavingsGoal } from '../types';

export const generateSampleData = (): Transaction[] => {
  const categories = [
    'Groceries', 'Electricity', 'Hair/Nails/Beauty', 'Pet Expenses', 'Eating Out', 
    'Clothing', 'Golf', 'Dischem/Clicks', 'Petrol', 'Gifts', 'Travel', 'Wine', 
    'Kids', 'House', 'Subscriptions', 'Ad Hoc'
  ];
  const descriptions = {
    Groceries: ['Pick n Pay', 'Woolworths', 'Checkers', 'Spar', 'Food Lovers'],
    Electricity: ['Eskom', 'City Power', 'Electricity Bill', 'Prepaid Electricity'],
    'Hair/Nails/Beauty': ['Hair Salon', 'Nail Salon', 'Beauty Treatments', 'Spa Day'],
    'Pet Expenses': ['Vet Bills', 'Pet Food', 'Pet Grooming', 'Pet Supplies'],
    'Eating Out': ['Restaurant', 'Takeaways', 'Coffee Shop', 'Fast Food'],
    Clothing: ['Edgars', 'Mr Price', 'Woolworths Clothing', 'Online Shopping'],
    Golf: ['Golf Course', 'Golf Equipment', 'Golf Lessons', 'Golf Club Fees'],
    'Dischem/Clicks': ['Dis-Chem', 'Clicks', 'Pharmacy', 'Health & Beauty'],
    Petrol: ['Shell', 'BP', 'Engen', 'Sasol', 'Caltex'],
    Gifts: ['Birthday Gifts', 'Christmas Gifts', 'Anniversary', 'Special Occasions'],
    Travel: ['Flights', 'Hotels', 'Car Rental', 'Holiday Expenses'],
    Wine: ['Wine Shop', 'Liquor Store', 'Wine Farm', 'Online Wine'],
    Kids: ['School Fees', 'Uniform', 'Sports Equipment', 'School Trip', 'Aftercare'],
    House: ['Home Depot', 'Builders Warehouse', 'Home Maintenance', 'Garden'],
    Subscriptions: ['Netflix', 'Spotify', 'DSTV', 'Gym Membership', 'Software'],
    'Ad Hoc': ['Incredible Connection', 'Online Purchase', 'Emergency Expense', 'Miscellaneous']
  };

  const incomeDescriptions = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Side Hustle'];
  
  const transactions: Transaction[] = [];
  const now = new Date();

  // Generate last 6 months of data for better historical analysis
  for (let month = 0; month < 6; month++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
    
    // Generate 2-3 income transactions per month (converted to ZAR amounts)
    for (let i = 0; i < Math.floor(Math.random() * 2) + 2; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const isJohno = Math.random() > 0.4; // 60% chance Johno, 40% Angela to reflect income split
      
      transactions.push({
        id: `income-${month}-${i}`,
        date: date.toISOString().split('T')[0],
        description: `${isJohno ? 'Johno' : 'Angela'} ${incomeDescriptions[Math.floor(Math.random() * incomeDescriptions.length)]}`,
        amount: isJohno ? Math.floor(Math.random() * 25000) + 45000 : Math.floor(Math.random() * 20000) + 35000, // Johno: R45k-70k, Angela: R35k-55k
        category: 'Income',
        type: 'income',
        account: Math.random() > 0.7 ? 'FNB Savings' : 'Standard Bank Cheque',
        assignedTo: isJohno ? 'self' : 'spouse'
      });
    }

    // Generate 15-25 expense transactions per month with some variation (converted to ZAR amounts)
    const baseExpenseCount = 20;
    const variation = Math.floor(Math.random() * 10) - 5; // -5 to +5
    const expenseCount = Math.max(10, baseExpenseCount + variation);
    
    for (let i = 0; i < expenseCount; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const category = categories[Math.floor(Math.random() * categories.length)];
      const categoryDescriptions = descriptions[category as keyof typeof descriptions];
      
      // Add some seasonal variation (converted to ZAR amounts)
      let baseAmount = Math.floor(Math.random() * 3000) + 150; // R150 - R3,150
      if (category === 'Electricity' && (monthDate.getMonth() === 11 || monthDate.getMonth() === 0 || monthDate.getMonth() === 1)) {
        baseAmount *= 1.5; // Higher utility bills in summer (SA)
      }
      if (category === 'Eating Out' && monthDate.getMonth() === 11) {
        baseAmount *= 1.3; // More entertainment spending in December
      }
      
      // Determine if expense is shared or personal
      const isShared = Math.random() > 0.6; // 40% chance of being shared
      const assignedTo = isShared ? 'shared' : (Math.random() > 0.5 ? 'self' : 'spouse');
      const splitPercentage = isShared ? 55 : undefined; // Johno's 55% share for shared expenses</Action>
      
      transactions.push({
        id: `expense-${month}-${i}`,
        date: date.toISOString().split('T')[0],
        description: categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)],
        amount: Math.floor(baseAmount),
        category,
        type: 'expense',
        account: Math.random() > 0.8 ? 'Absa Credit Card' : 'Standard Bank Cheque',
        assignedTo,
        splitPercentage
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const generateSampleSavingsGoals = (): SavingsGoal[] => {
  return [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      targetAmount: 150000, // R150,000
      currentAmount: 52500, // R52,500
      targetDate: '2024-12-31',
      priority: 'high',
      monthlyContribution: 7500, // R7,500
      category: 'Emergency'
    },
    {
      id: 'goal-2',
      name: 'Cape Town Holiday',
      targetAmount: 75000, // R75,000
      currentAmount: 18000, // R18,000
      targetDate: '2024-08-15',
      priority: 'medium',
      monthlyContribution: 4500, // R4,500
      category: 'Travel'
    },
    {
      id: 'goal-3',
      name: 'New Car Down Payment',
      targetAmount: 120000, // R120,000
      currentAmount: 42000, // R42,000
      targetDate: '2025-03-01',
      priority: 'medium',
      monthlyContribution: 6000, // R6,000
      category: 'Transportation'
    },
    {
      id: 'goal-4',
      name: 'Home Renovation',
      targetAmount: 225000, // R225,000
      currentAmount: 67500, // R67,500
      targetDate: '2025-06-01',
      priority: 'low',
      monthlyContribution: 9000, // R9,000
      category: 'Home'
    }
  ];
};