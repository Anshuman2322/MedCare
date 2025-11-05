import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategorySection from "./components/CategorySection";
import FeaturedMedicines from "./components/FeaturedMedicines";
import Footer from "./components/Footer";
import "./App.css";
import ShopByCategory from "./pages/ShopByCategory";

function App() {
  return (
    <div className="h-full w-full bg-white">
      <Navbar />
     <ShopByCategory />
      <Hero />
  <CategorySection />
  <FeaturedMedicines /> 
  <Footer />
    </div>
  );
}

export default App;