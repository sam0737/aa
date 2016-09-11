import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {BookService, BookAccountsComponent, BookTransactionType, BookTransaction, BookAccount, AmountValidator} from './../../lib/aabook';
import {SpendingDetailPage} from './../spending/spending';
import {ViewController, ModalController} from 'ionic-angular';

@Component({
  templateUrl: 'build/pages/settlement/settlement.html',
  directives: [BookAccountsComponent]
})
export class SettlementPage {
  list: any;
  constructor(private nav: NavController, private modal: ModalController, private bs: BookService) {
    this.list = [];
  }
  ionViewWillEnter() {
    this.refreshList();
  }
  refreshList()
  {
    let list = [];
    for (let trx of this.bs.active.reconciles)
    {
      list.push({
        trx: trx, 
        payers: trx.payerIds.map(i => this.bs.active.getAccount(i)),
        payees: trx.payeeIds.map(i => this.bs.active.getAccount(i))
      });
    }
    this.list = list;
  }
  goSettlement(trx)
  {
    let model = trx.clone();
    model.memo = 'Balance settlement';
    let m = this.modal.create(SpendingDetailPage, {model: model});
    m.onDidDismiss((data) => { if (data) this.bs.save(); });
    m.present();
  }
}
