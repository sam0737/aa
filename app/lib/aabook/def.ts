export const enum BookTransactionType {
  Spending = 1, // one payer, multiple payees
  Transfer = 2  // one payer, one payee
}
export interface BookTransaction {
  id: string;
  modified: Date;

  type: BookTransactionType;
  isDeleted: number;
  amount: number;
  amountRaw: number;
  memo: string;
  payerIds: string[];
  payeeIds: string[];
  time: Date;
  freeze(): Object;
  thaw(data: any): BookTransaction;
  clone(): BookTransaction;
}

export const enum BookAccountType {
  Person = 1,
  Wallet = 2
}

export interface BookAccount {
  id: string;
  modified: Date;

  type: BookAccountType;
  name: string;
  balance: number;
  balanceRaw: number;
  freeze(): Object;
  thaw(data: any): BookAccount;
  clone(): BookAccount;
}

export interface BookAbstract {
  id: string;
  name: string;
  modified: Date;
}

export interface Book {
  id: string;
  name: string;

  transactions: BookTransaction[];
  accounts: BookAccount[];
  reconciles: BookTransaction[];
  getTransaction(id: string): BookTransaction;
  getLatestSpendingTransaction(): BookTransaction;
  createTransaction(): BookTransaction;
  removeTransaction(id: string): void;
  replaceTransaction(trx: BookTransaction): void;
  getAccount(id: string): BookAccount;
  createAccount(): BookAccount;
  replaceAccount(account: BookAccount): void;
  freeze(): Object;
  thaw(data: any): Book;
  clone(): Book;
}

