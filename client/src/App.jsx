import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import Hero from "./components/Hero";
import BrandMarquee from "./components/BrandMarquee";
import CategorySection from "./components/CategorySection";
import FeaturedMedicines from "./components/FeaturedMedicines";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import FloatingHomeButton from "./components/FloatingHomeButton";
import SEO from "./components/SEO.jsx";
import ChatWidget from "./components/chat/ChatWidget.jsx";
import ToastViewport from "./components/common/Toast.jsx";
import { CurrencyProvider } from "./store/useStore.jsx";
import "./App.css";

// Only the Home route's own components load eagerly (that's the page most
// visits land on first). Everything else is route-split so a visit to "/"
// doesn't pay for the Shop page, product details, and every policy page
// up front.
const ShopByCategory = lazy(() => import("./pages/ShopByCategory"));
const MedicineDetails = lazy(() => import("./pages/MedicineDetails"));
const InquiryWizardPage = lazy(() => import("./pages/InquiryWizardPage"));
const Cart = lazy(() => import("./pages/Cart"));
const Favorites = lazy(() => import("./pages/Favorites"));
const About = lazy(() => import("./pages/About"));
const CustomerReviews = lazy(() => import("./pages/Reviews"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function App() {
  return (
    // reducedMotion="user" makes every framer-motion component in the tree
    // (About.jsx, ProductCard.jsx, CategoryCard.jsx, Hero.jsx, etc.) honor
    // prefers-reduced-motion automatically, without having to thread
    // useReducedMotion() through each one individually.
    <MotionConfig reducedMotion="user">
      <CurrencyProvider>
        <div className="h-full w-full bg-white">
          <ScrollToTop behavior="instant" />
          <Navbar />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <SEO
                      description="Branded generic medicines from established Indian manufacturers, supplied to buyers in the USA, UK, Canada, Australia and beyond. Highly rated by our buyers. Request a free quote."
                      path="/"
                    />
                    <Hero />
                    <BrandMarquee />
                    <CategorySection />
                    <FeaturedMedicines />
                    <Testimonials />
                  </>
                }
              />
              <Route path="/shop" element={<ShopByCategory />} />
              <Route path="/medicine/:slug" element={<MedicineDetails />} />
              <Route path="/inquiry/:slug" element={<InquiryWizardPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/about" element={<About />} />
              <Route path="/reviews" element={<CustomerReviews />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
          <FloatingHomeButton />
          <ChatWidget />
          <ToastViewport />
        </div>
      </CurrencyProvider>
    </MotionConfig>
  );
}

export default App;
