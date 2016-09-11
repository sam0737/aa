import {Component} from '@angular/core';
import {BookService, BookAbstract, Book} from './../../lib/aabook';
import {TranslatePipe} from "ng2-translate/ng2-translate";

let VERSION = '0.2.0';

@Component({
  templateUrl: 'build/pages/about/about.html',
  pipes: [TranslatePipe]
})
export class AboutPage {
  version: string = VERSION;
  constructor(private bs: BookService) {
  }
}
