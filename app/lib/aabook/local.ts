import {BookTransactionType, BookTransaction, BookAccountType, BookAccount, Book} from './def';

function generateUuid()
{
  var d = new Date().getTime();
  if(window.performance && typeof window.performance.now === "function") {
    d += performance.now(); //use high-precision timer if available
  }
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid;
}

export class LocalBookTransaction implements BookTransaction {
  id: string;
  modified: Date;

  type: BookTransactionType;
  isDeleted: number;
  amountRaw: number;
  memo: string;
  payerIds: string[];
  payeeIds: string[];
  time: Date;

  constructor() {
    this.id = generateUuid();
    this.modified = new Date();
    this.type = BookTransactionType.Spending;
    this.isDeleted = 0;
    this.amountRaw = 0; // All amount are * 100 to avoid floating point processing
    this.memo = '';
    this.payerIds = [];
    this.payeeIds = [];
    this.time = new Date();
    this.time.setMilliseconds(0);
    this.time.setSeconds(0);
  }

  get amount(): number {
    return this.amountRaw / 100;
  }

  set amount(value: number) {
    this.amountRaw = Math.round(value * 100);
  }

  freeze(): Object {
    return {
      id: this.id,
      modified: this.modified.toISOString(),
      type: this.type,
      isDeleted: this.isDeleted,
      amountRaw: this.amountRaw,
      memo: this.memo,
      payerIds: this.payerIds.slice(),
      payeeIds: this.payeeIds.slice(),
      time: this.time.toISOString()
    };
  }
  thaw(data: any): BookTransaction {
    var obj = new LocalBookTransaction();
    obj.id = data.id;
    obj.modified = new Date(data.modified);
    obj.type = data.type;
    obj.isDeleted = data.isDeleted;
    obj.amountRaw = data.amountRaw;
    obj.memo = data.memo;
    obj.payerIds = data.payerIds.slice();
    obj.payeeIds = data.payeeIds.slice();
    obj.time = new Date(data.time);
    return obj;
  }
  clone(): BookTransaction {
    return (new LocalBookTransaction).thaw(this.freeze());
  }
}

export class LocalBookAccount implements BookAccount {
  id: string;
  modified: Date;

  type: BookAccountType;
  name: string;
  balanceRaw: number;

  constructor() {
    this.id = generateUuid();
    this.modified = new Date();
    this.type = BookAccountType.Person;
    this.name = '';
    this.balanceRaw = 0;
  }

  get balance(): number {
    return this.balanceRaw / 100;
  }

  set balance(value: number) {
    this.balanceRaw = Math.round(value * 100);
  }

  freeze(): Object {
    return {
      id: this.id,
      modified: this.modified.toISOString(),
      name: this.name,
      type: this.type,
      balanceRaw: this.balanceRaw
    };
  }
  thaw(data: any): BookAccount {
    var obj = new LocalBookAccount();
    obj.id = data.id;
    obj.modified = new Date(data.modified);
    obj.name = data.name;
    obj.type = data.type;
    obj.balanceRaw = data.balanceRaw;
    return obj;
  }
  clone(): BookAccount {
    return (new LocalBookAccount).thaw(this.freeze());
  }
}

export class LocalBook implements Book {
  id: string;
  name: string;
  transactions: BookTransaction[];
  accounts: BookAccount[];
  reconciles: BookTransaction[];
  constructor() {
    this.id = generateUuid();
    this.name = '';
    this.transactions = [];
    this.accounts = [];
    this.reconciles = [];
  }
  getTransaction(id: string): BookTransaction {
    return this.transactions.find(function (e) { return e.id == id; });
  }
  getLatestSpendingTransaction(): BookTransaction {
    for (let i = 0; i < this.transactions.length; i++)
    {
      if (this.transactions[i].type == BookTransactionType.Spending)
        return this.transactions[i];
    }
    return null;  
  }
  createTransaction(): BookTransaction {
    let trx = new LocalBookTransaction();
    return trx;
  }
  removeTransaction(id: string): void {
    var idx = this.transactions.findIndex(function (e) { return e.id == id; });
    if (idx < 0) return;
    this.transactions.splice(idx, 1);
    this.cleanupAccount();
    this.calculateReconcile();
  }
  replaceTransaction(trx: BookTransaction): void {
    trx.modified = new Date();
    var idx = this.transactions.findIndex(function (e) { return e.id == trx.id; });

    if (idx >= 0) { this.transactions[idx] = trx; } else { this.transactions.push(trx); }
    // this.spendingMap[spending.id] = spending;
    this.transactions.sort(function (a, b) { 
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time > b.time ? -1 : a.time < b.time ? 1 : 0; 
    });
    this.cleanupAccount();
    this.calculateReconcile();
  }
  getAccount(id: string): BookAccount {
    return this.accounts.find(function (e) { return e.id == id; });
  }
  createAccount(): BookAccount {
    let account = new LocalBookAccount();
    return account;
  }
  replaceAccount(account: BookAccount): void {
    account.modified = new Date();
    var idx = this.accounts.findIndex(function (e) { return e.id == account.id; });
    if (idx >= 0) { this.accounts[idx] = account; } else { this.accounts.push(account); }
    this.accounts.sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  cleanupAccount(): void {
    let used = [];
    this.transactions.forEach(function (t) {
      t.payerIds.forEach(function (aid) { used[aid] = 1; });
      t.payeeIds.forEach(function (aid) { used[aid] = 1; });
    });

    let newAccounts = [];
    this.accounts.forEach(function (a) {
      if (!(a.id in used)) return;
      newAccounts.push(a);
    });
    this.accounts = newAccounts;
  }
  calculateReconcile(): void {
    let balanceMap = this.getBalanceMap();
    let balances = [];
    for (let a in balanceMap) {
      balances.push({ id: a, amount: balanceMap[a] });
    }
    let posBalances = balances.filter(b => { return b.amount > 0; });
    let negBalances = balances.filter(b => { return b.amount < 0; });
    posBalances.sort((a, b) => { return b.amount - a.amount; });
    negBalances.sort((a, b) => { return a.amount - b.amount; });

    let reconciles: BookTransaction[] = [];

    while (posBalances.length > 0 && negBalances.length > 0)
    {
      let trx = this.createTransaction();
      trx.type = BookTransactionType.Transfer;
      trx.payerIds = [posBalances[0].id];
      trx.payeeIds = [negBalances[0].id];
      let amount = (posBalances[0].amount >= (- negBalances[0].amount)) ?
        -negBalances[0].amount : posBalances[0].amount;
      trx.amountRaw = amount;
      reconciles.push(trx);

      posBalances[0].amount -= amount;
      negBalances[0].amount += amount;

      if (posBalances[0].amount == 0) 
        posBalances.shift();
      if (negBalances[0].amount == 0) 
        negBalances.shift();
    }
    this.reconciles = reconciles;
  }

  private getBalanceMap(): { [s: string]: number; } {
    let balances: { [s: string]: number; } = {};
    let remainLoop: string[] = [];
    let payLoopIndex = 0;
    let receiveLoopIndex = 0;

    if (this.accounts.length == 0)
      return;

    this.accounts.forEach(a => {
      balances[a.id] = 0; 
      remainLoop.push(a.id);
    });

    this.transactions.forEach(function (t) {
      let payOne = Math.floor(t.amountRaw / t.payerIds.length);
      let payRemaining = t.amountRaw - payOne * t.payerIds.length;
      t.payerIds.forEach(p => { balances[p] -= payOne; });
      for (; payRemaining > 0;) {
        if (t.payerIds.indexOf(remainLoop[payLoopIndex]) >= 0) {
          balances[remainLoop[payLoopIndex]] -= 1;
          payRemaining--;
        }
        payLoopIndex++;
        if (payLoopIndex >= remainLoop.length) payLoopIndex = 0;
      }

      let receiveOne = Math.floor(t.amountRaw / t.payeeIds.length);
      let receiveRemaining = t.amountRaw - receiveOne * t.payeeIds.length;
      t.payeeIds.forEach(p => { balances[p] += receiveOne; });
      for (; receiveRemaining > 0;) {
        if (t.payeeIds.indexOf(remainLoop[receiveLoopIndex]) >= 0) {
          balances[remainLoop[receiveLoopIndex]] -= 1;
          receiveRemaining--;
        }
        receiveLoopIndex++;
        if (receiveLoopIndex >= remainLoop.length) receiveLoopIndex = 0;
      }
    });

    return balances;
  }

  freeze(): Object {
    return {
      id: this.id,
      name: this.name,
      transactions: this.transactions.map(i => i.freeze()),
      accounts: this.accounts.map(i => i.freeze())
    };
  }
  thaw(data: any): Book {
    var obj = new LocalBook();
    obj.id = data.id;
    obj.name = data.name;
    obj.transactions = data.transactions.map(i => (new LocalBookTransaction).thaw(i));
    obj.accounts = data.accounts.map(i => (new LocalBookAccount).thaw(i));
    obj.cleanupAccount();
    obj.calculateReconcile();
    return obj;
  }
  clone(): Book {
    return (new LocalBook).thaw(this.freeze());
  }
}
