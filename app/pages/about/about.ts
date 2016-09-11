import {Component} from '@angular/core';
import {BookService, BookAbstract, Book} from './../../lib/aabook';

let VERSION = '0.1';

@Component({
  templateUrl: 'build/pages/about/about.html'
})
export class AboutPage {
  version: string = VERSION;
  constructor(private bs: BookService) {
  }
}
