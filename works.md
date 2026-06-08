# BuildLinka — Works & Roadmap

## ✅ Completed Features

### Navigation
- [x] Splash/onboarding screen with green gradient + animated entrance
- [x] 4-tab bottom navigation (Home, Materials, Workers, Profile)
- [x] Stack navigation for product detail screen
- [x] File-based routing via expo-router

### Home Screen
- [x] Location bar + notification bell with dot
- [x] Personalized greeting
- [x] Search bar with filter button
- [x] Hero promo card (green gradient, CTA buttons)
- [x] Category grid (8 visible + expandable toggle to 12)
- [x] Featured banner carousel (auto-scroll, gradient cards)
- [x] Today's Best Deals horizontal scroll
- [x] Popular Vendors mini cards row
- [x] Workers Near You horizontal scroll with hire CTA
- [x] Pull to refresh
- [x] Staggered fade-in section animations

### Materials Screen
- [x] Search bar
- [x] Filter toggle with active-count badge
- [x] Grid/list view toggle
- [x] Category chips (horizontal scroll, pill-shaped)
- [x] Animated sort panel (Popular, Price Low/High, Rating)
- [x] Active filter chip with removable close
- [x] 2-column grid view (inline GridCard)
- [x] List view (horizontal ProductCard)
- [x] Pull to refresh
- [x] Empty state

### Workers Screen
- [x] Search bar
- [x] Grid/list view toggle
- [x] Trade chips with MaterialIcons (Mason, Electrician, etc.)
- [x] "Available Only" toggle with active state
- [x] "Top Rated" toggle with active state
- [x] Worker count badge
- [x] 2-column grid view (WorkerGridCard)
- [x] List view (WorkerCard)
- [x] Pull to refresh
- [x] Empty state

### Profile Screen
- [x] Green gradient header with settings gear
- [x] Avatar with verified badge
- [x] User name, email, location
- [x] Stats card (Orders, Listings, Reviews, Rating)
- [x] Orange gradient referral card with share button
- [x] Recent Activity section (3 items)
- [x] Orders menu (My Orders, Saved Items, Order History)
- [x] Listing menu (My Listings, Add New Listing, My Reviews)
- [x] Settings menu (Edit Profile, Notifications, Language, Saved Locations, Privacy & Security, About)
- [x] Notification badge (3)
- [x] Logout button
- [x] Pull to refresh
- [x] Staggered fade-in section animations

### Product Detail Screen
- [x] Hero image area with decorative circles
- [x] Social proof badge ("23 watching")
- [x] Product badge (Best Seller, Top Rated, New)
- [x] Out of stock overlay
- [x] Vendor badge card with store icon
- [x] 5-star rating display
- [x] Location display
- [x] Price + Delivery side-by-side card
- [x] Quantity selector with +/- and minimum guard
- [x] Tabbed info section (Details, Reviews, Shipping)
- [x] "You May Also Like" horizontal scroll
- [x] Bottom action bar (wishlist, add to cart with total, contact)
- [x] Not-found error state
- [x] Pull to refresh

### Shared Components
- [x] SearchBar (focus state, close button, filter icon)
- [x] CategoryCard (icon + name, colored tint background)
- [x] ProductCard (vertical grid + horizontal list mode, badge, rating, cart button)
- [x] WorkerCard (avatar, name, trade, rating, location, rate, hire button, availability)
- [x] FeaturedBanner (auto-scroll carousel, gradient cards, animated dots)

### Theme & Data
- [x] Green (#2E7D32) + Orange (#E65100) color palette
- [x] Naira (₦) currency formatting
- [x] Mock data: 12 categories, 8 products, 6 workers, 4 vendors
- [x] Nigerian location data (Lagos, Abuja, Port Harcourt, Kano)

---

## 🚧 Next Work — Priority

### Authentication & Onboarding
- [ ] Login / Signup screens (email + password)
- [ ] Social login (Google, Apple)
- [ ] Phone number verification (OTP)
- [ ] Multi-step onboarding / tutorial carousel
- [ ] Password reset flow
- [ ] Biometric authentication

### Cart & Checkout
- [ ] Cart screen with persistent state
- [ ] Increase/decrease quantity in cart
- [ ] Remove items from cart
- [ ] Checkout flow (delivery address, order summary)
- [ ] Payment integration (Paystack / Flutterwave)
- [ ] Order confirmation screen
- [ ] Order tracking with status updates

### Orders & History
- [ ] My Orders screen (active, completed, cancelled)
- [ ] Order detail screen
- [ ] Re-order functionality
- [ ] Rate & review purchased items
- [ ] Invoice / receipt generation

### User Management
- [ ] Edit profile (name, phone, email, avatar)
- [ ] Change password
- [ ] Saved addresses management
- [ ] Notification preferences
- [ ] Language selection (English, Hausa, Yoruba, Igbo, Pidgin)

### Listings & Marketplace
- [ ] Add product listing (name, price, images, category, location)
- [ ] Edit / delete my listings
- [ ] Listing approval workflow
- [ ] Vendor dashboard (sales, views, inquiries)
- [ ] Vendor verification process

### Worker Hiring Flow
- [ ] Worker profile detail screen
- [ ] Hire request form (date, duration, description)
- [ ] Booking calendar
- [ ] Worker availability management
- [ ] Job completion & review flow

### Messaging / Chat
- [ ] In-app messaging between buyers and vendors
- [ ] Chat with workers
- [ ] Message notifications
- [ ] File/image sharing in chat

### Search & Discovery
- [ ] Search autocomplete suggestions
- [ ] Advanced filters (price range, location radius, rating)
- [ ] Recent searches
- [ ] Barcode/QR scan for products
- [ ] Voice search

### Location & Maps
- [ ] Map view for nearby vendors
- [ ] Location-based sorting
- [ ] Store locator / directions
- [ ] Delivery zone selection

### Social & Engagement
- [ ] Favorites / wishlist (persisted)
- [ ] Share products via social media
- [ ] Product reviews with photos
- [ ] Worker reviews with photos
- [ ] Referral program tracking

### Performance & Polish
- [ ] Image caching & lazy loading
- [ ] Skeleton loading states
- [ ] Offline support (cached data)
- [ ] Push notifications
- [ ] Deep linking
- [ ] App state persistence (Redux/Zustand)
- [ ] Dark mode support
- [ ] Accessibility (screen reader support)

### Admin & Backend
- [ ] API integration (REST or GraphQL)
- [ ] Admin dashboard (manage users, listings, orders)
- [ ] Content moderation
- [ ] Analytics / reporting
- [ ] Customer support ticket system

### Cross-Cutting
- [ ] Unit tests (Jest)
- [ ] E2E tests (Detox / Maestro)
- [ ] CI/CD pipeline
- [ ] App store (iOS, Android) builds
- [ ] Performance monitoring (Sentry)
- [ ] Feature flags

---

## 🎨 Design System (Apply Consistently)
- Green: #2E7D32 / #388E3C / #1B5E20
- Orange: #E65100 / #FF8F00 / #BF360C
- Accent: #FFC107 (amber)
- Background: #F5F5F5
- Cards: #FFFFFF
- Text: #212121 / #757575
- Naira formatting: `₦` prefix with locale separators
