import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategorySection from "./components/CategorySection";
import FeaturedMedicines from "./components/FeaturedMedicines";
import Footer from "./components/Footer";
import ShopByCategory from "./pages/ShopByCategory";
import MedicineDetails from "./pages/MedicineDetails";
import About from "./pages/About";
import "./App.css";

{/Temporary comment/}
function App() {
  return (
    <div className="h-full w-full bg-white">
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
      </Routes>
    </div>
  );
}

export default App;