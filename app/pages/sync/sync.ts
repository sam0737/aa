import {Component} from '@angular/core';
import {BookService, BookAbstract, Book} from './../../lib/aabook';
import {ViewController, NavController, ModalController, ToastController} from 'ionic-angular';
import {DateFormatPipe} from './../../lib/moment-pipe';
import * as moment from 'moment';

@Component({
  templateUrl: 'build/pages/sync/sync.html',
  pipes: [DateFormatPipe]
})
export class SyncPage {
  constructor(private nav: NavController, private modal: ModalController, private toastCtrl: ToastController, private bs: BookService) {
  }
}
