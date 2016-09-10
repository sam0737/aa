import {Component} from '@angular/core';
import {Platform, LoadingController, ionicBootstrap} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {TabsPage} from './pages/tabs/tabs';
import {BookService} from './lib/aabook';

@Component({
  templateUrl: 'build/root.html'
})
export class MyApp {
  private rootPage: any;

  constructor(private loadingCtrl: LoadingController, private platform: Platform, private bs: BookService) {
    let loader = this.loadingCtrl.create({
      content: "Please wait...",
    });
    let loaderShown = false;
    // Show loader if platform ready needs more than 700ms
    let loaderTimeout = setTimeout(() => { loaderShown = true; loader.present(); }, 700);

    platform.ready().then(() => {
      bs.loaded.then(() => { 
        this.rootPage = TabsPage; 
        clearTimeout(loaderTimeout);
        if (loaderShown) loader.dismiss();
      });

      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
    });
  }
}

ionicBootstrap(MyApp, [BookService]);
