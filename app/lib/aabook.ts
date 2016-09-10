import {LocalBook} from './aabook/local';
import {Book, BookTransaction} from './aabook/def';
import {Injectable, Component, Input} from '@angular/core';
import {Control, ControlGroup} from "@angular/common";
import {BookAccountType, BookAccount} from './aabook/def';
import {Storage, SqlStorage, ToastController} from 'ionic-angular';

export {Book, BookTransactionType, BookTransaction, BookAccountType, BookAccount} from './aabook/def';

@Injectable()
export class BookService {
  private _active: Book;
  private _storage: Storage;
  private _settings;

  public loaded: Promise<void>;

  constructor(private toastCtrl: ToastController) {
    this._storage = new Storage(SqlStorage);
    this._settings = {};

    this._active = new LocalBook();
    this.loaded = 
      this.loadSettings().then(() => {
        if (this._settings.lastBook) {
          this.loadBook(this._settings.lastBook).then(book => {
            this._active = book;
          });
        }
      });
  }
  get active(): Book {
    return this._active;
  }

  save(): Promise<void> {
    return this.saveBook(this.active);
  }

  private loadSettings(): Promise<void> {
    return this._storage.get('aa2.settings').then(value => {
      if (value != null)
        this._settings = JSON.parse(value);
    });
  }
  private saveSettings(): Promise<void> {
    return this._storage.set('aa2.settings', JSON.stringify(this._settings));
  }

  private loadBook(id: string): Promise<Book> {
    return this._storage.get('aa2.books.' + id).then(value => {
      let j = JSON.parse(value);
      return (new LocalBook).thaw(j);
    });
  }
  private saveBook(book: Book): Promise<void> {
    console.log('Saving');
    return this._storage.set('aa2.books.' + book.id, JSON.stringify(book.freeze())).then(() => {
      if (this._settings.lastBook !== book.id)
      {
        this._settings.lastBook = book.id;
        this.saveSettings();
      }
      console.log('Saved');
    }).catch(e => {
      console.log('Failed. ' + e);
      this.toastCtrl.create({
        message: 'Failed to save changes: ' + e,
        position: 'bottom'
      }).present();
    });
  }
}

@Component({
  selector: 'aa-accounts',
  template: '<span class="aa-tag" *ngFor="let a of accounts">{{ a.name }}</span>'
})
export class BookAccountsComponent {
  @Input() accounts: BookAccount[];
}

interface ValidationResult {
  [key: string]: boolean;
}

export function AmountValidator(control: Control): ValidationResult {
  let str: string = '' + control.value;
  let val: number = parseInt('' + ((+str) * 100 + 0.5), 10);
  if (('' + (val / 100)) == str && val >= 0 && val < 1000000000) {
    return null;
  }
  return { amountValidator: true };
}
export function BookAccountTypeValidator(control: Control): ValidationResult {
  if (control.value === "1" || control.value === "2") {
    return null;
  }
  return { bookAccountTypeValidator: true };
}
