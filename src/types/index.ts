export type TransactionType = 'recurring' | 'sporadic';
export type GoalPriority = 'low' | 'medium' | 'high';
export type PaymentMethodType = 'credit' | 'debit' | 'cash';
export interface UserSettings {
  id: string;
  userId: string;
  emailUser: string | null;
  emailPass: string | null;
  emailHost: string | null;
  emailPort: number | null;
  updatedAt: string;
}

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'bills'
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'bonus'
  | 'savings'
  | 'other';

export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  date: string; // ISO string
  endDate?: string; // Data di fine per ricorrenze
  paymentMethodId?: string;
  note?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  date: string;
  endDate?: string; // Data di fine per ricorrenze
  paymentMethodId?: string;
  note?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  priority: GoalPriority;
  deadline?: string;
  note?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodType;
  balance: number;
  createdAt: string;
}
