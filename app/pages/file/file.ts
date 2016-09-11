import {Component} from '@angular/core';
import {BookService, BookAbstract, Book} from './../../lib/aabook';
import {ViewController, NavController, ModalController, ToastController} from 'ionic-angular';
import {DateFormatPipe} from './../../lib/moment-pipe';
import * as moment from 'moment';

@Component({
  templateUrl: 'build/pages/file/file.html',
  pipes: [DateFormatPipe]
})
export class FilePage {
  list: (Book | BookAbstract)[];
  model: Book;
  oldName: string;

  constructor(private nav: NavController, private modal: ModalController, private toastCtrl: ToastController, private bs: BookService) {
    this.list = [];
    if (this.bs.active.name == null) this.bs.active.name = '';
    this.model = this.bs.active;
    this.oldName = this.model.name;
  }
  ionViewWillEnter() {
    this.refreshList();
  }
  ionViewWillUnload() {
    if (this.oldName != this.model.name) {
      this.bs.saveBook(this.model);
    }
  }
  refreshList()
  {
    this.model = this.bs.active;
    this.bs.allBooks().then(data => {
      this.list = data.map(v => {
        return v.id == this.bs.active.id ? this.bs.active : v;
      });
    });
  }
  newBook(id)
  {
    let book = this.bs.newBook();
    this.bs.generateNewBookName('Book - ' + moment().format('L')).then((name) => {
      book.name = name;
      this.bs.active = book;
      this.bs.save();
      this.nav.pop();
    });
  }
  loadBook(id)
  {
    this.bs.loadBook(id).then(book => {
      if (book != null) {
        this.bs.active = book;
        this.nav.pop();
      }
    });
  }
  cloneBook(id) {
    this.bs.loadBook(id).then(book => {
      if (book != null) {
        this.bs.generateNewBookName(book.name).then((newName) => {
          let newBook = this.bs.newBook();
          let id = newBook.id;
          newBook.thaw(book.freeze());
          newBook.name = newName;
          newBook.id = id;
          return this.bs.saveBook(newBook);
        }).then(() => {
          this.refreshList()
        });
      }
    });
  }
  deleteBook(id) {
    if (id == this.bs.active.id)
      return;

    let undelete: Book = null;
    this.bs.loadBook(id).then((book) => {
      undelete = book;
    }).catch((e) => {
      console.log(['Unable to look book for undelete', id, e]);
    }).then(() => {
      return this.bs.deleteBook(id);
    }).then(() => {
      let t = this.toastCtrl.create({
        message: undelete.name + ' has been deleted',
        showCloseButton: true,
        closeButtonText: 'Undo'
      });
      let closedByTimeout = false;
      let timeoutHandle = setTimeout(() => { closedByTimeout = true; t.dismiss(); }, 5000);
      t.onDidDismiss(() => {
        if (closedByTimeout) return;
        clearTimeout(timeoutHandle);

        // Undo
        this.bs.saveBook(undelete).then(() => {
          this.refreshList();
        });
      });
      t.present();

      this.refreshList()
    });
  }
}
