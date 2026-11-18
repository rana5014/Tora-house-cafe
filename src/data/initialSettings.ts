import { CafeSettings } from '../types';

export const initialCafeSettings: CafeSettings = {
  cafeName: 'TORA HOUSE',
  cafeNameAr: 'بيت تورا',
  taglineEn: 'Fresh Taste. Every Moment.',
  taglineAr: 'طعم طازج. في كل لحظة.',
  whatsappNumber: '966579165664', // Normalized international click-to-chat format
  whatsappDisplay: '+966 57 916 5664',
  phoneDisplay: '+966 57 916 5664',
  email: 'hello@torahouse.sa',
  addressEn: 'King Abdulaziz Road, Al Malqa District, Riyadh, Saudi Arabia',
  addressAr: 'طريق الملك عبدالعزيز، حي الملقا، الرياض، المملكة العربية السعودية',
  city: 'Riyadh',
  openingHoursEn: 'Daily: 6:00 AM – 2:00 AM (Friday: 1:00 PM – 2:00 AM)',
  openingHoursAr: 'يومياً: 6:00 صباحاً – 2:00 فجراً (الجمعة: 1:00 ظهراً – 2:00 فجراً)',
  currency: 'SAR',
  currencyAr: 'ر.س',
  taxRate: 0, // Prices inclusive or configurable
  deliveryFee: 10,
  freeDeliveryThreshold: 75,
  announcementBannerEn: '🎉 Welcome to TORA HOUSE! Order directly on WhatsApp for instant VIP confirmation.',
  announcementBannerAr: '🎉 أهلاً بكم في بيت تورا! اطلب الآن عبر الواتساب لتأكيد طلبك الفوري بكل سهولة.',
  showAnnouncement: true,
  instagramUrl: 'https://instagram.com/torahouse.sa',
  tiktokUrl: 'https://tiktok.com/@torahouse.sa',
  snapchatUrl: 'https://snapchat.com/add/torahouse.sa',
  twitterUrl: 'https://x.com/torahouse_sa',
  moyasarPublishableKey: 'pk_test_vcFUAGuvJyBgAyuhAQ71R4Bifhgf7rHA824876b5',
  moyasarLiveMode: false,
};

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  dateEn: string;
  dateAr: string;
  commentEn: string;
  commentAr: string;
  avatar: string;
  favoriteItem: string;
}

export const initialTestimonials: Testimonial[] = [
  {
    id: 'rev-1',
    name: 'Sultan Al-Otaibi',
    rating: 5,
    dateEn: '2 days ago',
    dateAr: 'منذ يومين',
    commentEn: 'The Ice Spanish Latte is genuinely one of the smoothest in Riyadh. Perfect balance of sweetness and espresso punch. Fast WhatsApp ordering too!',
    commentAr: 'الآيس سبانش لاتيه عندهم من أفضل ما جربت في الرياض بدون مبالغة، الحلاوة متوازنة مع قوة الإسبريسو. والطلب عبر الواتساب سريع جداً!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    favoriteItem: 'Ice Spanish Latte',
  },
  {
    id: 'rev-2',
    name: 'Reem Al-Ghamdi',
    rating: 5,
    dateEn: '1 week ago',
    dateAr: 'منذ أسبوع',
    commentEn: 'The Mojito Blue and fresh Strawberry Mojito are super refreshing during warm afternoons! The Cheese Croissant was served warm and perfectly flaky.',
    commentAr: 'الموهيتو الأزرق وموهيتو الفراولة منعشين بشكل خيالي في الصيف! وكرواسون الجبن كان مقرمش ولذيذ يذوب في الفم.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    favoriteItem: 'Mojito Blue & Cheese Croissant',
  },
  {
    id: 'rev-3',
    name: 'Fahad Al-Shammari',
    rating: 5,
    dateEn: '2 weeks ago',
    dateAr: 'منذ أسبوعين',
    commentEn: 'Exceptional V60 drip coffee! They use top-tier Ethiopian and Colombian specialty beans. Karrak tea is also rich and authentically spiced.',
    commentAr: 'قهوة الـ V60 عندهم خرافية بحبوب إثيوبية وكولومبية فاخرة وإيحاءات واضحة. وشاي الكرك مضبوط على أصوله.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    favoriteItem: 'Ice V60 & Karrak Tea',
  },
  {
    id: 'rev-4',
    name: 'Nouf Al-Dosari',
    rating: 5,
    dateEn: '3 weeks ago',
    dateAr: 'منذ 3 أسابيع',
    commentEn: 'Love the premium 3D ordering experience! Very clean website, intuitive customization for syrup and ice level, and super fast order preparation.',
    commentAr: 'أجمل موقع كافيه شفته بالرياض، تجربة 3D مميزة وسهولة في اختيار النكهات ودرجة السكر والثلج وتأكيد الطلب بالواتساب بدقائق.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    favoriteItem: 'Ice Matcha & Donut',
  },
];
