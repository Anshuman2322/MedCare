import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/categoryModel.js";

dotenv.config();

const categories = [
"Anti Cancer Medicines",
"Anticancer Medicine",
"Anti Cancer Medicine",
"Hiv Drugs",
"Diabetes Medicine",
"Anti Cancer Injection",
"Hormones And Steroid API",
"Anaemia Medicine",
"Active Pharmaceutical Ingredients",
"Amino Acid",
"Blood Pressure Medicine",
"Anti Cancer Tablets",
"Pharmaceutical Ingredients",
"Antifungal Injection,Tablet & Syrup",
"Antiviral Drugs",
"Antibiotic Injection",
"Steroid Injections",
"Anti Infective API",
"Antibacterial Drugs",
"Immunosuppressive Drugs",
"Pharmaceutical Injection",
"Fertility Enhancer Drugs",
"Pharmaceutical Tablets",
"Antiparasitic Drug",
"Blood System And Cardiovascular API",
"Vitamin Powder API",
"Anti Cancer Capsules",
"Steroid",
"Anti Viral Tablets",
"Anti Infective Agent",
"Antiepileptic Drugs",
"Anti Inflammatory Drugs",
"Anti HIV Medicines",
"Kidney Medicines",
"Contrast Media",
"Pharmaceutical Medicines",
"Erectile Dysfunction Medicine",
"Anti Smoking Drugs",
"Anticoagulant",
"Psychotherapeutic Agents",
"Anti Inflammatory And Immunosuppressant",
"Antibiotic Tablets",
"Injectable Products",
"Esomeprazole Drugs",
"Thyroxine Sodium Tablets",
"Hair Growth Medicines",
"Api Intermediates And Pharmaceutical Ingredients",
"Antihistamines",
"Amoxicillin Drugs",
"Osteoporosis Medications",
"Testosterone Injection",
"Antibiotic Tablets & Capsules",
"Anti Cancer Drugs",
"Asthma Inhaler",
"Anesthetic",
"Herbal Extracts",
"Antimigraine Drug",
"Anti Inflammatory And Immunosuppressant API",
"Skin Care Medicines",
"Arthritic Drugs",
"Pharmaceutical Capsules",
"Anthelmintics Drugs",
"Antifungal",
"Skin Ointment",
"Anti Allergic Drug",
"Antipyretic Medication",
"Vitamin Tablets & Capsules",
"Protein Powder",
"Nervous System And Antipsychotic API",
"Food Enzymes",
"Iv Fluids",
"Malaria Medicine",
"Anti Ulcer Drugs",
"Veterinary API",
"Softgel Capsules",
"Neutraceuticals",
"Antidiabetic Tablets",
"Anthelmintics",
"Skin Cream",
"Antituberculosis Drug",
"Vitamin & Multivitamin Injections",
"Antibiotic Capsules",
"Blood Pressure",
"Contraceptives",
"Skin Lightening Drugs",
"Common Disease Medicine",
"Antidepressant & Anti Anxiety Medicines",
"Pharmaceutical Sachets",
"Food Additive"
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to DB");

    await Category.deleteMany(); // optional reset

    await Category.insertMany(
      categories.map(name => ({ name }))
    );

    console.log("All categories inserted 🚀");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();