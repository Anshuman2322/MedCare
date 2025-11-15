import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import Hero from "./components/Hero";
import CategorySection from "./components/CategorySection";
import FeaturedMedicines from "./components/FeaturedMedicines";
import Footer from "./components/Footer";
import FloatingHomeButton from "./components/FloatingHomeButton";
import ShopByCategory from "./pages/ShopByCategory";
import MedicineDetails from "./pages/MedicineDetails";
import { CurrencyProvider } from "./store/useStore.jsx";

import About from "./pages/About";
import Contact from "./pages/Contact";
import "./App.css";

{/*Temporary comment*/}
function App() {
  return (
    <CurrencyProvider>
      <div className="h-full w-full bg-white">
        <ScrollToTop behavior="instant" />
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <CategorySection />
                <FeaturedMedicines />
                <Footer />
              </>
            }
          />
          <Route path="/shop" element={<ShopByCategory />} />
          <Route path="/products/:id" element={<MedicineDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <FloatingHomeButton />
      </div>
    </CurrencyProvider>
  );
}

export default App;