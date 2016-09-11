import {HTTP_PROVIDERS, Http} from '@angular/http';
import {Component, ViewChild} from '@angular/core';
import {Platform, ionicBootstrap, Menu, NavController, ModalController} from 'ionic-angular';
import {StatusBar, Splashscreen} from 'ionic-native';
import {TabsPage} from './pages/tabs/tabs';
import {FilePage} from './pages/file/file';
import {SyncPage} from './pages/sync/sync';
import {AboutPage} from './pages/about/about';
import {BookService} from './lib/aabook';
import {BookLanguageService, LanguageSelectComponent} from './lib/aalanguage';
import {TRANSLATE_PROVIDERS, TranslateService, TranslatePipe, TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';
import * as moment from 'moment';
import 'moment/min/locales.min';

@Component({
  templateUrl: 'build/root.html',
  providers: [NavController],
  directives: [LanguageSelectComponent],
  pipes: [TranslatePipe]
})
export class MyApp {
test = 'auto';
  @ViewChild('content') nav: NavController;
  @ViewChild('menu') menu: Menu;
  private rootPage: any;

  constructor(private platform: Platform, private modal: ModalController, private bs: BookService, private bls: BookLanguageService) {
    platform.ready().then(() => {
      moment.locale(window.navigator.userLanguage || window.navigator.language);

      bs.loaded.then(() => { 
        this.rootPage = TabsPage; 
        this.hideSplashScreen();
      });

      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
    });
  }
  private hideSplashScreen() {
    if (Splashscreen) {
      setTimeout(() => {
        Splashscreen.hide();
      }, 100);
    }
  }
  goFile() { this.nav.push(FilePage); }
  goSync() { this.nav.push(SyncPage); }
  goAbout() { this.nav.push(AboutPage); }
}

ionicBootstrap(MyApp, [
  BookService, 
  BookLanguageService,
  { 
    provide: TranslateLoader,
    useFactory: (http: Http) => new TranslateStaticLoader(http, 'assets/i18n', '.json'),
    deps: [Http]
  },
  TranslateService
]);
