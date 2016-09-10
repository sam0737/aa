import {Component} from '@angular/core';
import {ControlGroup, Validators} from '@angular/common';
import {FORM_DIRECTIVES, FormBuilder, FormGroup} from '@angular/forms';
import {NavController, NavParams} from 'ionic-angular';
import {BookService, BookAccountsComponent, BookTransactionType, BookTransaction, BookAccount, 
  AmountValidator, ArrayNonZeroValidator} from './../../lib/aabook';
import {ViewController, ModalController} from 'ionic-angular';

import {AccountSelectorPage} from './../account/account';
import * as moment from 'moment';

interface SpendingItemView {
  header?: string;
  item?: BookTransaction;
}

@Component({
  templateUrl: 'build/pages/spending/spending.html',
  directives: [BookAccountsComponent]
})
export class SpendingPage {
  list: any;
  spendingType = BookTransactionType.Spending;
  transferType = BookTransactionType.Transfer;

  constructor(private nav: NavController, private modal: ModalController, private bs: BookService) {
    this.list = [];
  }
  ionViewDidEnter() {
    this.refreshList();
  }
  refreshList()
  {
    let list = [];
    let group_date = null;
    let details = [];
    for (let trx of this.bs.active.transactions)
    {
      if (!group_date || group_date.toDateString() != trx.time.toDateString())
      {
        if (group_date)
          list.push({ header: group_date, details: details });
        group_date = trx.time;
        details = [];
      }
      details.push({
        trx: trx, 
        payers: trx.payerIds.map(i => this.bs.active.getAccount(i)),
        payees: trx.payeeIds.map(i => this.bs.active.getAccount(i))
      });
    }
    if (group_date)
      list.push({ header: group_date, details: details });
    this.list = list;
  }
  goSpending(id: string)
  {
    let m = this.modal.create(SpendingDetailPage, {id: id});
    m.onDidDismiss((data) => { if (data) this.bs.save(); });
    m.present();
  }
  deleteTransaction(id: string)
  {
    this.bs.active.removeTransaction(id);
    this.refreshList();
  }
  newSpending()
  {
    let m = this.modal.create(SpendingDetailPage);
    m.onDidDismiss((data) => { if (data) this.bs.save(); });
    m.present();
  }
  newTransfer()
  {
    let m = this.modal.create(SpendingDetailPage, {mode: 'transfer'});
    m.onDidDismiss((data) => { if (data) this.bs.save(); });
    m.present();
  }
}

@Component({
  templateUrl: 'build/pages/spending/spending-detail.html',
  directives: [BookAccountsComponent]
})
export class SpendingDetailPage {
  form: FormGroup;
  amount: string;

  model: BookTransaction;
  isSpending: boolean;
  payers: BookAccount[];
  payees: BookAccount[];

  time: string;
  new: boolean;
  constructor(private nav: NavController, private modal: ModalController, private view: ViewController, private navParams: NavParams, private bs: BookService, private fb: FormBuilder) {
    let model = navParams.get('model');
    if (model != null)
    {
      this.model = model;
      this.new = false;
    } else {
      let id = navParams.get('id');
      this.new = (id === undefined);

      this.model = this.new ? bs.active.createTransaction() : bs.active.getTransaction(id).clone();
      if (this.new)
        this.model.type = navParams.get('mode') == 'transfer' ? BookTransactionType.Transfer : BookTransactionType.Spending;
    }

    this.isSpending = this.model.type == BookTransactionType.Spending;

    if (this.new && this.isSpending)
    {
      let lt = this.bs.active.getLatestSpendingTransaction();
      if (lt != null)
        this.model.payerIds = lt.payerIds.slice();
    }

    this.form = fb.group({  
      'amount': ['', Validators.compose([Validators.required, AmountValidator])],
      'payerIds': [[], Validators.compose([ArrayNonZeroValidator])],
      'payeeIds': [[], Validators.compose([ArrayNonZeroValidator])],
      'memo': '',
      'time': ['', Validators.compose([Validators.required])],
    });
    this.amount = this.new ? '' : (''+this.model.amount)
    this.time = moment(this.model.time).local().format();
    this.refreshPayersAndPayees();
  }
  refreshPayersAndPayees() {
    this.payers = this.model.payerIds.map(i => this.bs.active.getAccount(i));
    this.payees = this.model.payeeIds.map(i => this.bs.active.getAccount(i));
  }
  selectPayer() {
    let m = this.modal.create(AccountSelectorPage, {'mode': 'payer', 'multiple': false, 'ids': this.model.payerIds});
    m.onDidDismiss(data => {
      if (data && data.ids) {
        this.model.payerIds = data.ids.slice(0, 1);
        this.refreshPayersAndPayees();
      }
    });
    m.present();
  }
  selectClients() {
    let m = this.modal.create(AccountSelectorPage, {'mode': 'client', 'multiple': true, 'ids': this.model.payeeIds});
    m.onDidDismiss(data => {
      if (data && data.ids) {
        this.model.payeeIds = data.ids;
        this.refreshPayersAndPayees();
      }
    });
    m.present();
  }
  selectPayee() {
    let m = this.modal.create(AccountSelectorPage, {'mode': 'payee', 'multiple': false, 'ids': this.model.payeeIds});
    m.onDidDismiss(data => {
      if (data && data.ids) {
        this.model.payeeIds = data.ids.slice(0, 1);
        this.refreshPayersAndPayees();
      }
    });
    m.present();
  }
  dismiss() {
    this.view.dismiss();
  }
  save() {
    if (!this.form.valid) return;
    this.model.amount = +this.amount;
    this.model.time = moment(this.time).toDate();
    this.bs.active.replaceTransaction(this.model);

    this.view.dismiss(true);
  }

}
