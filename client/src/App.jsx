import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import Hero from "./components/Hero";
import BrandMarquee from "./components/BrandMarquee";
import CategorySection from "./components/CategorySection";
import FeaturedMedicines from "./components/FeaturedMedicines";
import Footer from "./components/Footer";
import FloatingHomeButton from "./components/FloatingHomeButton";
import SEO from "./components/SEO.jsx";
import { CurrencyProvider } from "./store/useStore.jsx";
import "./App.css";

// Only the Home route's own components load eagerly (that's the page most
// visits land on first). Everything else is route-split so a visit to "/"
// doesn't pay for the Shop page, product details, and every policy page
// up front.
const ShopByCategory = lazy(() => import("./pages/ShopByCategory"));
const MedicineDetails = lazy(() => import("./pages/MedicineDetails"));
const InquiryWizardPage = lazy(() => import("./pages/InquiryWizardPage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
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
                      description="Trusted medicines, verified suppliers and transparent healthcare procurement — all in one modern marketplace. Submit an inquiry and our team follows up directly."
                      path="/"
                    />
                    <Hero />
                    <BrandMarquee />
                    <CategorySection />
                    <FeaturedMedicines />
                  </>
                }
              />
              <Route path="/shop" element={<ShopByCategory />} />
              <Route path="/medicine/:slug" element={<MedicineDetails />} />
              <Route path="/inquiry/:slug" element={<InquiryWizardPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
          <FloatingHomeButton />
        </div>
      </CurrencyProvider>
    </MotionConfig>
  );
}

export default App;
