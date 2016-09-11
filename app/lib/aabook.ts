import {LocalBook} from './aabook/local';
import {Book, BookTransaction} from './aabook/def';
import {Injectable, Component, Input} from '@angular/core';
import {Control, ControlGroup} from "@angular/common";
import {BookAbstract, BookAccountType, BookAccount} from './aabook/def';
import {Storage, SqlStorage, ToastController} from 'ionic-angular';

export {Book, BookAbstract, BookTransactionType, BookTransaction, BookAccountType, BookAccount} from './aabook/def';
import * as moment from 'moment';

@Injectable()
export class BookService {
  private _active: Book;
  private storage: Storage;
  private _settings;

  public loaded: Promise<void>;

  constructor(private toastCtrl: ToastController) {
    this.storage = new Storage(SqlStorage);
    this._settings = {};

    this._active = new LocalBook();
    this.loaded = 
      this.checkUpgrade()
        .then(() => this.loadSettings())
        .then(() => {
          if (this._settings.lastBook) {
            this.loadBook(this._settings.lastBook).then(book => {
              if (book != null)
                this._active = book;
            });
          } else {
            this.markActiveAsCurrent();
          }
        }).catch(e => {
          this.loadFailure(e);
        });
  }

  get active(): Book {
    return this._active;
  }
  set active(value: Book) {
    if (value != null) {
      this._active = value;
      this.markActiveAsCurrent();
    }
  }

  save(): Promise<void> {
    return this.saveBook(this.active);
  }

  private markActiveAsCurrent(): Promise<void> {
    if (this._settings.lastBook !== this.active.id)
    {
      this._settings.lastBook = this.active.id;
      return this.saveSettings();
    }
    return Promise.resolve();
  }

  allBooks(): Promise<BookAbstract[]> {
    return this.storage.query('SELECT id, name, modified FROM books ORDER BY modified DESC').then(data => {
      let books: BookAbstract[] = [];
      for (let i = 0; i < data.res.rows.length; i++)
      {
        let row = data.res.rows.item(i);
        books.push({ id: ''+row.id, name: ''+row.name, modified: moment.unix(row.modified).toDate() });
      }
      return books;
    });
  }

  private checkUpgrade(): Promise<void> {
    return this.storage.get('aa2.version').then(v => {
      let p: Promise<void>[] = [];
      let oldV = v;
      if (v == "1" || v == "3") {
        p.push(this.storage.query(`DROP TABLE IF EXISTS books`));
        v = "4";
      } else if (v == "4" || v == null) {
        p.push(this.storage.query(`
          CREATE TABLE IF NOT EXISTS books (id TEXT PRIMARY KEY, name TEXT, modified INTEGER, data TEXT)
        `));
        v = "5";
      }
      if (v != oldV) {
        p.push(this.storage.set('aa2.version', v));
        return Promise.all(p).then(() => this.checkUpgrade());
      }
      return Promise.resolve();
    });
  }

  private loadSettings(): Promise<void> {
    return this.storage.get('aa2.settings').then(value => {
      if (value != null) {
        let v = JSON.parse(value);
        if (typeof v == "object")
          this._settings = v;
      }    
    });
  }

  private saveSettings(): Promise<void> {
    return this.storage.set('aa2.settings', JSON.stringify(this._settings));
  }

  newBook() {
    return (new LocalBook);
  }

  loadBook(id: string): Promise<Book> {
    return this.storage.query('SELECT data FROM books WHERE id=?', [id]).then(data => {
      if (data.res.rows.length == 0) return null;        
      let j = JSON.parse(data.res.rows.item(0).data);
      return (new LocalBook).thaw(j);
    });
  }

  saveBook(book: Book): Promise<void> {
    return this.storage.query(
      `REPLACE INTO books (id, name, data, modified) VALUES (?, ?, ?, ?)`,
      [ book.id, book.name, JSON.stringify(book.freeze()), moment().unix() ]
    ).catch(e => {
      this.toastCtrl.create({
        message: 'Failed to save changes: ' + e,
        position: 'bottom',
        duration: 5000
      }).present();
    });
  }

  deleteBook(id: string): Promise<void> {
    return this.storage.query('DELETE FROM books WHERE id=?', [id]);
  }
    
  generateNewBookName(oldName: string, iteration = 1): Promise<string> {
    oldName = oldName.replace(/ \([0-9]+\)$/, '');
    let newName = iteration == 1 ? oldName : oldName + ' (' + iteration + ')';
    return this.checkName(newName).then((count) => {
      if (count == 0) {
        return Promise.resolve(newName);
      }
      return this.generateNewBookName(oldName, iteration + 1);
    });
  }

  private checkName(name: string): Promise<number> {
    return this.storage.query('SELECT count(*) as c FROM books WHERE name=?', [name]).then((data) => {
      return data.res.rows.item(0).c;  
    });
  }

  private loadFailure(e) {
    this.toastCtrl.create({
      message: 'Failed to load data: ' + e + '\nYou might need to reinstall/reset the app.',
      position: 'bottom',
      duration: 10000
    }).present();
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
export function ArrayNonZeroValidator(control: Control): ValidationResult {
  if (control.value.length > 0) {
    return null;
  }
  return { arrayNonZeroValidator: true };
}
