import {Component} from '@angular/core';
import {SpendingPage} from '../spending/spending';
import {AccountPage} from '../account/account';
import {SettlementPage} from '../settlement/settlement';

@Component({
  templateUrl: 'build/pages/tabs/tabs.html'
})
export class TabsPage {

  private tab1Root: any;
  private tab2Root: any;
  private tab3Root: any;

  constructor() {
    // this tells the tabs component which Pages
    // should be each tab's root Page
    this.tab1Root = SpendingPage;
    this.tab2Root = AccountPage;
    this.tab3Root = SettlementPage;
  }
}
