import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Loading, LoadingController, App, ModalController } from 'ionic-angular';
import { ProductDetailPage } from '../product-detail/product-detail';
import { DbserviceProvider } from '../../providers/dbservice/dbservice';
import { DescriptionModelPage } from '../description-model/description-model';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import * as jwt_decode from "jwt-decode";
import { ViewProfilePage } from '../view-profile/view-profile';
import { ConstantProvider } from '../../providers/constant/constant';

@IonicPage()
@Component({
    selector: 'page-products',
    templateUrl: 'products.html',
})
export class ProductsPage {
    prod_cat_list:any=[];
    filter :any = {};
    flag:any='';
    loading:Loading;
    cat_images:any=[];
    lang:any='';
    tokenInfo:any={};
    uploadUrl:any="";
    constructor(public navCtrl: NavController, public navParams: NavParams,public service:DbserviceProvider,public con:ConstantProvider,public loadingCtrl:LoadingController,private app:App, public modalCtrl: ModalController,public translate:TranslateService,public storage:Storage) {
        
    }
    
    ionViewDidLoad() {
        console.log('ionViewDidLoad ProductsPage');
        this.get_user_lang();
        this.uploadUrl = this.con.upload_url;
    }
    ionViewWillEnter()
    {
        this.getProductCategoryList();
        this.presentLoading();
        
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
                if(this.lang == "")
                {
                    this.lang = "en";
                }
                this.translate.use(this.lang);
            })
        })
    }
    getDecodedAccessToken(token: string): any {
        try{
            return jwt_decode(token);
        }
        catch(Error){
            return null;
        }
    }
    goOnProductDetailPage(id){
        this.navCtrl.push(ProductDetailPage,{'id':id})
    }
    getProductCategoryList()
    {
        console.log('catagorylist');
        this.filter.limit = 0;
        this.service.post_rqst({'filter' : this.filter},'app_master/categoryList')
        .subscribe( (r) =>
        {
            console.log(r);
            this.loading.dismiss();
            this.prod_cat_list=r['categories'];
        });
    }
    
    loadData(infiniteScroll)
    {
        console.log('loading');
        this.filter.limit=this.prod_cat_list.length;
        this.service.post_rqst({'filter' : this.filter},'app_master/categoryList')
        .subscribe( (r) =>
        {
            console.log(r);
            if(r['categories']=='')
            {
                this.flag=1;
            }
            else
            {
                setTimeout(()=>{
                    this.prod_cat_list=this.prod_cat_list.concat(r['categories']);
                    console.log('Asyn operation has stop')
                    infiniteScroll.complete();
                },1000);
            }
        });
    }
    presentLoading() 
    {
        this.translate.get("Please wait...")
        .subscribe(resp=>{
            this.loading = this.loadingCtrl.create({
                content: resp,
                dismissOnPageChange: false
            });
            this.loading.present();
        })
    }
    ionViewDidLeave()
    {
        let nav = this.app.getActiveNav();
        if(nav && nav.getActive()) 
        {
            let activeView = nav.getActive().name;
            let previuosView = '';
            if(nav.getPrevious() && nav.getPrevious().name)
            {
                previuosView = nav.getPrevious().name;
            }  
            console.log(previuosView); 
            console.log(activeView);  
            console.log('its leaving');
            if((activeView == 'HomePage' || activeView == 'GiftListPage' || activeView == 'TransactionPage' || activeView == 'ProfilePage' ||activeView =='MainHomePage') && (previuosView != 'HomePage' && previuosView != 'GiftListPage'  && previuosView != 'TransactionPage' && previuosView != 'ProfilePage' && previuosView != 'MainHomePage')) 
            {
                
                console.log(previuosView);
                this.navCtrl.popToRoot();
            }
        }
    }
    
    view_description(value,id) 
    {
        console.log(value);
        
        let contactModal = this.modalCtrl.create(DescriptionModelPage,{'description':value,'id':id});
        contactModal.present();
        console.log('otp');
    }


      
}
