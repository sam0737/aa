import {Component} from '@angular/core';
import {ControlGroup, Validators} from '@angular/common';
import {FORM_DIRECTIVES, FormBuilder, FormGroup} from '@angular/forms';
import {NavController, NavParams, ViewController, ModalController} from 'ionic-angular';
import {BookService, BookAccountType, BookAccount, BookAccountTypeValidator} from './../../lib/aabook';

@Component({
  templateUrl: 'build/pages/account/account.html'
})
export class AccountPage {
  wallets: any[];
  people: any[];
  constructor(private navCtrl: NavController, private modal: ModalController, private bs: BookService) {
    this.wallets = [];
    this.people = [];
  }
  ionViewDidEnter() {
    this.refreshList();
  }

  refreshList()
  {
    let wallets = [];
    let people = [];
    for (let a of this.bs.active.accounts)
    {
      if (a.type == BookAccountType.Wallet)
        wallets.push({ account: a });
      if (a.type == BookAccountType.Person)
        people.push({ account: a });
    }
    this.wallets = wallets;
    this.people = people;
  }
  add()
  {
    this.modal.create(AccountDetailPage, {modal: true}).present().then(() => { this.bs.save(); });
  }
  goAccount(id: string)
  {
    this.modal.create(AccountDetailPage, {'modal': true, 'id': id}).present().then(() => { this.bs.save(); });
  }
}

@Component({
  templateUrl: 'build/pages/account/account-selector.html'
})
export class AccountSelectorPage {
  wallets: any[];
  people: any[];
  mode: string;
  multiple: boolean;

  valid: boolean;
  _singleId: string;
  constructor(private nav: NavController, private view: ViewController, private navParams: NavParams, private modal: ModalController, private bs: BookService) {
    this.mode = navParams.get('mode');
    this.multiple = !!navParams.get('multiple');
    this.valid = true;
    this.wallets = [];
    this.people = [];

    this.refreshList(navParams.get('ids'));
    let ids = this.selectedIds();
    this.singleId = ids.length == 1 ? ids[0] : undefined;
  }
  get singleId(): string {
    return this._singleId;
  }
  set singleId(value: string) {
    this._singleId = value;
    this.valid = this.multiple || value !== undefined;
  }

  refreshList(oldIds)
  {
    let wallets = [];
    let people = [];
    let ids = oldIds !== undefined ? oldIds : this.selectedIds();
    for (let a of this.bs.active.accounts)
    {
      if (a.type == BookAccountType.Wallet)
        wallets.push({ account: a, checked: ( ids.indexOf(a.id)>=0 ) });
      if (a.type == BookAccountType.Person)
        people.push({ account: a, checked: ( ids.indexOf(a.id)>=0 ) });
    }
    this.wallets = wallets;
    this.people = people;
  }
  selectedIds()
  {
    if (!this.multiple && this.singleId != null)
      return [this.singleId];
    let ids = [];
    Array.prototype.push.apply(ids, this.wallets.filter(i => { return i.checked; }).map(i => { return i.account.id; }) );
    Array.prototype.push.apply(ids, this.people.filter(i => { return i.checked; }).map(i => { return i.account.id; }) );
    return ids;
  }
  add()
  {
    let m = this.modal.create(AccountDetailPage, {modal: true});
    m.onDidDismiss(data => {
      if (data) {
        if (data.id) {
          if (this.multiple) {
            this.refreshList(this.selectedIds().concat([data.id]));
          } else {
            this.refreshList([data.id]);
            this.singleId = data.id;
          }          
        } else {
          this.refreshList(undefined);
        }
      }
    });
    m.present();
  }
  save()
  {
    this.view.dismiss({ ids: this.selectedIds() });
  }
  dismiss()
  {
    this.view.dismiss();
  }
}

@Component({
  templateUrl: 'build/pages/account/account-detail.html'
})
export class AccountDetailPage {
  form: FormGroup;

  model: BookAccount;
  new: boolean;
  type: string;
  isModal: boolean;
  constructor(private nav: NavController, private view: ViewController, private navParams: NavParams, private bs: BookService, private fb: FormBuilder) {
    this.isModal = navParams.get('modal');

    let id = navParams.get('id');
    this.new = (id === undefined);
    this.model = this.new ? bs.active.createAccount() : bs.active.getAccount(id).clone();
    if (this.new) {
      this.model.type = BookAccountType.Person;
      this.model.name = '#' + (bs.active.accounts.length+1);
    }
    this.type = ''+this.model.type;
    this.form = fb.group({
      'type': [this.type, Validators.compose([Validators.required, BookAccountTypeValidator])],
      'name': [this.model.name, Validators.compose([Validators.required])],
    });
  }
  dismiss() {
    this.view.dismiss();
  }
  save() {
    if (!this.form.valid) return;
    this.model.type = parseInt(this.type);
    this.bs.active.replaceAccount(this.model);

    if (this.isModal) {
      this.view.dismiss({ id: this.model.id });
    } else {
      this.nav.pop();
    }
  }
}
