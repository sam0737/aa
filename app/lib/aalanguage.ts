import {Injectable, Component, ViewChild} from '@angular/core';
import {BookService} from './aabook';
import {Select} from 'ionic-angular';
import {TRANSLATE_PROVIDERS, TranslateService, TranslatePipe, TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';

let LANGUAGES = ['auto', 'en', 'zh-yue', 'zh-tw'];

@Injectable()
export class BookLanguageService {
  private _language: string;
  constructor(private t: TranslateService, private bs: BookService) {
    this.bs.loaded.then(() => {
      this.language = this.bs.settings.language;
      this.setTranslationLanguage(this.bs.settings.language);
    });
  }
  get language(): string {
    return this._language; 
  }
  set language(value: string) {
    if (this._language == value) return;
    this._language = value;
    if (this.bs.settings.language != value)
    {
      this.bs.settings.language = value;
      this.bs.saveSettings();
    }
    this.setTranslationLanguage(value);
  }
  private setTranslationLanguage(language) {
    var userLang = language || window.navigator.userLanguage || window.navigator.language;
    if (/^zh-(?:hk|yue|mo)/i.test(userLang)) userLang = 'zh-yue';
    else if (/^zh-(?:cn|chs|hans|sg)/i.test(userLang)) userLang = 'zh-tw'; // TODO: zh-cn
    else if (/^zh(?:-tw)?/i.test(userLang)) userLang = 'zh-tw';
    else if (/^en-?/i.test(userLang)) userLang = 'en';
    else userLang = 'en';
    this.t.setDefaultLang('en');
    this.t.reloadLang('en').subscribe(() => this.t.use(userLang));
  }
}

@Component({
  selector: 'language-select',
  templateUrl: 'build/lib/language-select.html',
  pipes: [TranslatePipe]
})
export class LanguageSelectComponent {
  @ViewChild('select') select;
  languages = LANGUAGES;
  language: string = 'auto';
  constructor(private bls: BookLanguageService, private bs: BookService) {
    this.bs.loaded.then(() => {
      this.language = this.bls.language || 'auto';
    });
  }
  open() {
    this.select.open();
  }
  change() {
    this.bls.language = (this.language == 'auto' ? null : this.language);
  }
}
