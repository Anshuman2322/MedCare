import imgPain from '../assets/product-pain-relief.jpg';
import imgVitamins from '../assets/product-vitamins.jpg';
import imgAntibiotics from '../assets/product-antibiotics.jpg';
import imgSkincare from '../assets/product-skincare.jpg';

export const productImages = {
  'pain-relief': imgPain,
  'vitamins': imgVitamins,
  'antibiotics': imgAntibiotics,
  'skincare': imgSkincare,
};

export function getProductImage(imageKey, fallback) {
  return productImages[imageKey] || fallback || imgPain;
}
