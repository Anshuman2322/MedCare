import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ShopByCategory from './pages/ShopByCategory';
import "./App.css";
import ShopByCategory from "./pages/ShopByCategory";

function App() {
  return (
    <div className="h-full w-full bg-white">
      <Navbar />
      <ShopByCategory />
    </div>
  );
}

export default App;