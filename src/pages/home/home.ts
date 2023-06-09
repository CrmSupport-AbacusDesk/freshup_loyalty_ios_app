import { Component } from '@angular/core';
import { NavController, Loading, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { ScanPage } from '../scane-pages/scan/scan';
import { OfferListPage } from '../offer-list/offer-list';
import { PointListPage } from '../points/point-list/point-list';
import { DbserviceProvider } from '../../providers/dbservice/dbservice';
import { OffersPage } from '../offers/offers';
import { Storage } from '@ionic/storage';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner';
import { GiftListPage } from '../gift-gallery/gift-list/gift-list';
import { ViewProfilePage } from '../view-profile/view-profile';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { CoupanCodePage } from '../scane-pages/coupan-code/coupan-code';
import { ProfilePage } from '../profile/profile';
import { TermsPage } from '../terms/terms';
import { AboutusModalPage } from '../aboutus-modal/aboutus-modal';
import * as jwt_decode from "jwt-decode";
import { TranslateService } from '@ngx-translate/core';
import { ConstantProvider } from '../../providers/constant/constant';
import { CompassPage } from '../compass/compass';
import { AboutPage } from '../about/about';
import { FurnitureIdeasPage } from '../furniture-ideas/furniture-ideas';
import { ProductsPage } from '../products/products';
import { WorkingSitePage } from '../working-site/working-site';
import { FeedbackPage } from '../feedback/feedback';
import { NewsPage } from '../news/news';
import { VideoPage } from '../video/video';
import { ContactPage } from '../contact/contact';
import { FaqPage } from '../faq/faq';
import { TransactionPage } from '../transaction/transaction';
import { AdvanceTextPage } from '../advance-text/advance-text';
import { SocialSharing } from '@ionic-native/social-sharing';
import { NotificationPage } from '../notification/notification';
import { LanguagePage } from '../language/language';
import { KarigarsPage } from '../karigars/karigars';
@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    offer_list:any=[];
    loading:Loading;
    karigar_detail:any={};
    last_point:any='';
    today_point:any='';
    qr_code:any='';
    coupon_value:any='';
    uploadUrl:any='';
    tokenInfo:any = {};
    lang:any="";
    active:boolean = true;
    offer_detail:any={};
    language:any=[];
    
    constructor(public navCtrl: NavController,public service:DbserviceProvider,public loadingCtrl:LoadingController,public storage:Storage, private barcodeScanner: BarcodeScanner,public alertCtrl:AlertController,public modalCtrl: ModalController,private push: Push,public translate:TranslateService,public constant:ConstantProvider,public socialSharing:SocialSharing) {
        this.presentLoading();
        this.notification();
    }
    ionViewWillEnter()
    {
        this.uploadUrl = this.constant.upload_url;
        console.log('ionViewDidLoad HomePage');
        this.translate.setDefaultLang(this.lang);
        this.translate.use(this.lang);
        this.getData();
        this.get_user_lang();
        this.getofferBannerList();
    }
    
    doRefresh(refresher) 
    {
        console.log('Begin async operation', refresher);
        this.getData(); 
        refresher.complete();
    }
    
    total_balance_point:any;
    sharepoint:any=0;
    notify_cn=0;
    getData()
    {
        this.service.post_rqst({'karigar_id':this.service.karigar_id},'app_karigar/karigarHome')
        .subscribe((r:any)=>
        {
            console.log(r);
            this.loading.dismiss();
            this.language=r['language'];
            this.karigar_detail=r['karigar'];
            this.offer_detail=r['offer'];
            this.last_point=r['last_point'];
            this.notify_cn=r['notifications'];
            this.today_point=r['today_point'];
            this.total_balance_point = parseInt( this.karigar_detail.balance_point) + parseInt(this.karigar_detail.referal_point_balance );
            this.sharepoint=r['points']['owner_ref_point'];
        });
    }
    
    
    getofferBannerList()
    {
        console.log(this.service.karigar_id);
        console.log('offerbanner');
        this.service.post_rqst({'karigar_id':this.service.karigar_id},'app_karigar/offerList')
        .subscribe((r)=>
        {
            console.log(r);
            this.offer_list=r['offer'];
            console.log(this.offer_list);
        });
    } 
    
    
    scan_tips()
    {
        if(this.karigar_detail.status =='Pending'){
            this.showAlert("You Are Not verified");
        }else{
            //     let contactModal = this.modalCtrl.create(AboutPage);
            //     contactModal.present();
            //     contactModal.onDidDismiss(resp=>{
            //     console.log(resp);
            
            // })
            this.scan();
        }
        // let contactModal = this.modalCtrl.create(AboutPage);
        // contactModal.present();
        // contactModal.onDidDismiss(resp=>{
        //     console.log(resp);
        //     this.scan();
        // })
    }
    
    
    qr_count:any=0;
    qr_limit:any=0;
    scan()
    {
        if( this.karigar_detail.manual_permission==1)
        {
            this.navCtrl.push(CoupanCodePage)
        }
        else
        {
            this.service.post_rqst({'karigar_id':this.service.karigar_id},"app_karigar/get_qr_permission")
            .subscribe(resp=>{
                console.log(resp);
                this.qr_count = resp['karigar_daily_count'];
                this.qr_limit = resp['qr_limit'];
                console.log(this.qr_count);
                console.log(this.qr_limit);
                
                if(parseInt(this.qr_count) <= parseInt(this.qr_limit) )
                {
                    const options:BarcodeScannerOptions =  { 
                        prompt : ""
                    };
                    this.barcodeScanner.scan(options).then(resp => {
                        console.log(resp);
                        this.qr_code=resp.text;
                        console.log( this.qr_code);
                        if(resp.text != '')
                        {
                            this.service.post_rqst({'karigar_id':this.service.karigar_id,'qr_code':this.qr_code},'app_karigar/karigarCoupon')
                            .subscribe((r:any)=>
                            {
                                console.log(r);
                                
                                if(r['status'] == 'INVALID'){
                                    this.translate.get("Invalid Coupon Code")
                                    .subscribe(resp=>{
                                        this.showAlert(resp);
                                    })
                                    return;
                                }
                                if(r['status'] == 'UNAUTHORISED'){
                                    this.translate.get("You are unauthorised")
                                    .subscribe(resp=>{
                                        this.showAlert(resp);
                                    })
                                    return;
                                }
                                else if(r['status'] == 'USED'){
                                    this.translate.get("Coupon Already Used")
                                    .subscribe(resp=>{
                                        this.showAlert(resp);
                                    })
                                    return;
                                }
                                else if(r['status'] == 'UNASSIGNED OFFER'){
                                    this.translate.get("This Coupon Code is not applicable in your Area")
                                    .subscribe(resp=>{
                                        this.showAlert(resp);
                                    })
                                    return;
                                }
                                this.translate.get(" points has been added into your wallet")
                                .subscribe(resp=>{
                                    this.showSuccess( r['coupon_value'] +resp)
                                })
                                this.getData();
                            });
                        }
                        else{
                            console.log('not scanned anything');
                        }
                    });
                }
                else
                {
                    this.translate.get("You have exceed the daily QR scan limit")
                    .subscribe(resp=>{
                        this.showAlert(resp);
                    })
                }
            })
        }
    }
    
    viewProfiePic()
    {
        this.modalCtrl.create(ViewProfilePage, {"Image": this.karigar_detail.profile,type:"base_64"}).present();
    }
    
    viewProfie()
    {
        this.navCtrl.push(ProfilePage)
    }
    
    goOnScanePage(){
        this.navCtrl.push(ScanPage);
    }
    
    goOnOffersListPage(){
        if(this.karigar_detail.status =='Pending'){
            // alert("You Are Not Verified!!");
            this.showAlert("You Are Not verified");
        }else{
            this.navCtrl.push(OfferListPage);
        }
    }
    goOnOffersPage(id)
    {
        this.navCtrl.push(OffersPage,{'id':id});
    }
    goOnKarigarsPage(){
        this.navCtrl.push(KarigarsPage);
    }
    goOnPointeListPage(id){
        // this.navCtrl.push(PointListPage,{'id':id});
        if(this.karigar_detail.status =='Pending'){
            this.showAlert("You Are Not verified");
        }else{
            this.navCtrl.push(PointListPage,{'id':id});
        }        
    }
    goOnWorkingSitePage()
    {
        // this.navCtrl.push(WorkingSitePage);
        if(this.karigar_detail.status =='Pending'){
            this.showAlert("You Are Not verified");
        }else{
            this.navCtrl.push(WorkingSitePage);
        }
    }
    gotoCompass()
    {
        this.navCtrl.push(CompassPage);
    }
    
    goOntermsPage(id){
        this.navCtrl.push(TermsPage, {'id':id});
    }
    
    goOnFeedbackPage()
    {
        this.navCtrl.push(FeedbackPage);
    }
    presentLoading() 
    {
        this.loading = this.loadingCtrl.create({
            content: "Please wait...",
            dismissOnPageChange: false
        });
        this.loading.present();
    }
    goOnGiftListPage(gift)
    {
        // this.navCtrl.push(GiftListPage,{'mode':'home'});
        if(this.karigar_detail.status =='Pending'){
            this.showAlert("You Are Not verified");
        }else{
            this.navCtrl.push(GiftListPage,{'mode':gift});
        }
    }
    
    goOnFurniturePage()
    {
        this.navCtrl.push(FurnitureIdeasPage);
    }
    goOnProductsPage()
    {
        this.navCtrl.push(ProductsPage);
    }
    viewDetail()
    {
        this.modalCtrl.create(ViewProfilePage, {"Image": this.lang !='en' ? this.offer_detail.hin_term_image : this.offer_detail.term_image}).present();
    }
    gotoHistory()
    {
        // this.navCtrl.push(TransactionPage)
        if(this.karigar_detail.status =='Pending'){
            this.showAlert("You Are Not verified");
        }else{
            this.navCtrl.push(TransactionPage)
        } 
    }
    goOnGiftGallary(redeem)
    {
        // this.navCtrl.push(GiftListPage)
        if(this.karigar_detail.status =='Pending'){
            this.showAlert("You Are Not verified");
        }else{
            this.navCtrl.push(GiftListPage,{'mode':redeem})
        } 
    }
    goOnNewsPage()
    {
        this.navCtrl.push(NewsPage);
    }
    goOnVideoPage()
    {
        this.navCtrl.push(VideoPage);
    }
    goOnContactPage()
    {
        this.navCtrl.push(ContactPage);
    }
    goOnfaqPage()
    {
        this.navCtrl.push(FaqPage);
    }
    goOnAdvanceTextPage()
    {
        this.navCtrl.push(AdvanceTextPage);
    }
    gotoNotification()
    {
        this.navCtrl.push(NotificationPage);
    }
    gotoChangeLang()
    {
        this.navCtrl.push(LanguagePage,{"come_from":"homepage"});
    }
    share()
    {
        if(this.karigar_detail.status =='Pending'){
            this.showAlert("You Are Not verified");
        }else{
            
            
            
            let image = "";
            let app_url = "https://apps.apple.com/us/app/fresh-up-mattress/id1638468052";
            
            this.socialSharing.share("Hey there join me (" + this.karigar_detail.full_name + " " + this.karigar_detail.country_code + " "  + this.karigar_detail.mobile_no + ") on Freshup Mattresses.  Enter my code *" + this.karigar_detail.referral_code + "* to earn points back in your wallet!", "Karigar Reffral", image, app_url)
            .then(resp => {
                console.log(resp);
                
            }).catch(err => {
                console.log(err);
            })
        }
    }
    showAlert(text)
    {
        let alert = this.alertCtrl.create({
            title:'Alert!',
            cssClass:'action-close',
            subTitle: text,
            buttons: ['OK']
        });
        alert.present();
    }
    showSuccess(text)
    {
        let alert = this.alertCtrl.create({
            title:'Success!',
            cssClass:'action-close',
            subTitle: text,
            buttons: ['OK']
        });
        alert.present();
    }
    
    notification()
    {
        console.log("notification called");
        
        this.push.hasPermission()
        .then((res: any) => {
            
            if (res.isEnabled) {
                console.log('We have permission to send push notifications');
            } else {
                console.log('We do not have permission to send push notifications');
            }
        });
        
        
        const options: PushOptions = {
            android: {
                senderID:'893824522432',
            },
            ios: {
                alert: 'true',
                badge: true,
                sound: 'true'
            },
            windows: {
                
            },
        };
        
        const pushObject: PushObject = this.push.init(options);
        
        pushObject.on('notification').subscribe((notification: any) => console.log('Received a notification', notification));
        pushObject.on('registration').subscribe((registration: any) => {
            console.log('Device registered', registration) 
            this.service.post_rqst({'id':this.service.karigar_id,'registration_id':registration.registrationId},'app_karigar/update_token').subscribe((r)=>
            {
                console.log(r);
                console.log("tokken saved");
                
            });
        }
        );
        
        pushObject.on('error').subscribe(error => console.error('Error with Push plugin', error));
    }
    
    openModal()
    {
        let contactModal = this.modalCtrl.create(AboutusModalPage);
        contactModal.present();
        return;
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
                console.log(this.lang);
                
                if(this.lang == "")
                {
                    this.lang = "en";
                }
                console.log(this.lang);
                this.translate.use(this.lang);
            })
        })
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
}
