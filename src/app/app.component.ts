import { Component, ViewChild } from '@angular/core';
import { Platform, Nav,Events, App, ToastController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ModalController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { ConstantProvider } from '../providers/constant/constant';
import { DbserviceProvider } from '../providers/dbservice/dbservice';
import { AboutusModalPage } from '../pages/aboutus-modal/aboutus-modal';
import * as jwt_decode from "jwt-decode";
import { AppVersion } from '@ionic-native/app-version';
import { LanguagePage } from '../pages/language/language';
import { TranslateService } from '@ngx-translate/core';
import { HomePage } from '../pages/home/home';
import { PushOptions, PushObject, Push } from '@ionic-native/push';
import { Market } from '@ionic-native/market';

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    
    @ViewChild(Nav) nav: Nav;
    rootPage:any;
    tokenInfo:any='';
    ok:any;
    avl_upd:any;
    cancl:any;
    upd_now:any;
    lang:any='en';
    
    constructor(public market: Market, public platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public modalCtrl: ModalController,public storage:Storage,public events:Events,public constant:ConstantProvider, private app: App,public toastCtrl:ToastController,public service:DbserviceProvider,public alertCtrl:AlertController,public app_version:AppVersion,public translate:TranslateService,private push: Push) 
    {
        this.translate.setDefaultLang(this.lang);
        this.translate.use(this.lang);       
        
        // uncomment for logout
        // this.storage.set('token','');
        
        storage.get('token').then((val) =>
        {
            if(val == '' || val == null || val == undefined)
            {
                this.rootPage=LanguagePage;
            }else  if(val ){
                this.tokenInfo = this.getDecodedAccessToken(val );
                this.service.post_rqst({'karigar_id':this.tokenInfo.sub },'app_karigar/profile')
                .subscribe((r)=>
                {
                    console.log(r);
                    if(r['status'] == "SUCCESS"){
                        
                        this.service.karigar_info = r['karigar'];
                        
                        if(this.service.karigar_info.del == '1')
                        {
                            this.rootPage=LanguagePage;
                            this.translate.get('Your Account has been suspended')
                            .subscribe(resp=>{
                                this.RequiredAlert(resp);
                            })
                            this.storage.set('token','');
                            this.events.publish('data','1', Date.now());
                            return;
                        }
                        else if(this.service.karigar_info.status == 'Verified')
                        {
                            // this.rootPage=HomePage;
                            this.nav.setRoot(HomePage)
                            // this.rootPage=TabsPage;
                        } 
                        else  if( this.service.karigar_info.status != 'Verified')
                        {
                            let contactModal = this.modalCtrl.create(AboutusModalPage);
                            contactModal.present();
                            return;
                        }
                    }
                    else
                    {
                        this.storage.set('token','');
                        this.events.publish('data','1', Date.now());
                        return;
                    }
                });
            }
        });
        
        events.subscribe('data',(data)=>
        {
            if(data==1)
            {
                storage.get('token')
                .then((val) => {
                    console.log(val);
                    
                    if(val == '' || val == null || val == undefined)
                    {
                        console.log('if');
                        this.nav.setRoot(LanguagePage);
                    }
                    else
                    {
                        console.log('else');
                        // this.nav.setRoot(TabsPage);
                        this.nav.setRoot(HomePage);
                    }
                });
            }
            console.log(data);
        })
        
        platform.ready().then(() => {
            statusBar.overlaysWebView(false);
            splashScreen.hide();
            statusBar.backgroundColorByHexString('#333333');      
            this.check_version();                 
            this.get_user_lang();
        });
        
        platform.registerBackButtonAction(() => {
            const overlayView = this.app._appRoot._overlayPortal._views[0];
            if (overlayView && overlayView.dismiss) {
                overlayView.dismiss();
                return;
            }
            
            let nav = app.getActiveNav();
            let activeView = nav.getActive().name;
            
            console.log(activeView);
            console.log(nav.canGoBack());
            
            if(activeView == 'HomePage' || activeView == 'MobileLoginPage' || activeView == 'OtpPage')
            {
                if(this.constant.backButton==0) 
                {
                    console.log('hello2');
                    
                    this.constant.backButton=1;
                    
                    let toast = this.toastCtrl.create({
                        message: 'Press again to exit!',
                        duration: 2000
                    });
                    
                    toast.present();
                    
                    setTimeout(() => 
                    {
                        this.constant.backButton=0;
                    },2500);
                    
                } 
                else 
                {
                    console.log('hello1');
                    this.platform.exitApp();
                }
                
            } 
            else if (nav.canGoBack()) 
            {
                console.log('ok');
                nav.pop();
            }
            else if(activeView == 'GiftListPage' || activeView == 'TransactionPage' || activeView == 'ProfilePage' || activeView =='MainHomePage')
            {
                nav.parent.select(0);
            }  
            else if (nav.canGoBack() == false) 
            {
                console.log('ok');
                 let alert = this.alertCtrl.create({
                  title: 'App termination',
                  message: 'Are you sure you want Exit?',
                  buttons: [
                    {
                      text: 'Stay',
                      handler: () => {
                        console.log('Cancel clicked');
                        // this.d.('Action Cancelled!')
                      }
                    },
                    {
                      text: 'Exit',
                      handler: () => {
                        this.platform.exitApp();
                      }
                    }
                  ]
                })
            
                alert.present();
                // nav.pop();
            }  
            else 
            {
                // this.platform.exitApp();
            }            
        });
    }
    getDecodedAccessToken(token: string): any
    {
        try{
            return jwt_decode(token);
        }
        catch(Error){
            return null;
        }
    }
    RequiredAlert(text)
    {
        this.translate.get("Alert")
        .subscribe(resp=>{
            let alert = this.alertCtrl.create({
                title:resp+'!',
                cssClass:'action-close',
                subTitle: text,
                buttons: [this.ok]
            });
            alert.present();
        })
    }
    
    version:any='';
    db_app_version:any='';
    check_version()
    {
        console.log('version funcation call');
        
        this.app_version.getVersionNumber()
        .then((resp)=>{
            console.log(resp, 'app version check');
            
            this.version = resp;
            this.service.post_rqst("","app_karigar/get_version")
            .subscribe(resp=>{
                console.log(resp);
                this.db_app_version = resp.version.ios_version;
                this.db_app_version = this.db_app_version.version;
                console.log(this.db_app_version);
                if(this.version != this.db_app_version)
                {
                    this.translate.get("OK")
                    .subscribe(resp=>{
                        this.ok = resp;
                    })
                    
                    this.translate.get("Update Available")
                    .subscribe(resp=>{
                        this.avl_upd = resp;
                    })
                    
                    this.translate.get('Cancel')
                    .subscribe(resp=>{
                        this.cancl = resp;
                    })
                    
                    this.translate.get('Update Now')
                    .subscribe(resp=>{
                        this.upd_now = resp;
                    })
                    this.translate.get("A newer version of this app is available for download. Please update it from AppStore")
                    .subscribe((resp)=>{
                        let updateAlert = this.alertCtrl.create({
                            title: this.avl_upd,
                            message: resp+'!',
                            buttons: [
                                {text: this.cancl, },
                                {text: this.upd_now,
                                    handler: () => {
                                        this.market.open("id1638468052");
                                    } 
                                }
                            ]
                        });
                        updateAlert.present();
                    })
                }
            })
        })
    }
    
    get_user_lang()
    {
        this.storage.get("token")
        .then(resp=>{
            this.tokenInfo = this.getDecodedAccessToken(resp );
            
            this.service.post_rqst({"login_id":this.tokenInfo.sub},"app_karigar/get_user_lang")
            .subscribe(resp=>{
                console.log(resp);
                this.lang = resp['language'];
                this.translate.use(this.lang);                                          
                
                // commented
                
            })
        })
    }
}
