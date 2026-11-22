import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BrandMarquee from '../components/BrandMarquee.jsx';
import { brandsFromCatalogue, catalogueStats } from '../utils/catalogue.js';

const med = (name, brand, category = 'ED') => ({ name, brand, category });

const catalogue = [
  med('Tadalista 20 (Tadalafil Tablets 20 mg)', 'Tadalista'),
  med('Tadalista 10 (Tadalafil Tablets 10 mg)', 'tadalista'),
  med('Cenforce 100 (Sildenafil Citrate Tablets IP 100 mg)', 'Cenforce'),
  med('Fildena 100 (Sildenafil Citrate Tablets 100 mg)', 'Fildena'),
  med('Lexaheal 10 (Escitalopram Tablets IP 10 mg)', 'Lexaheal', 'Mental Health'),
  med('Iverheal 12 (Ivermectin Tablets USP 12 mg)', 'Iverheal', 'Anti-Parasitic'),
  med('Ocumoist Max Eye Drops', 'Ocumoist', 'Eye Care'),
  med('Azicip 500 (Azithromycin Tablets IP 500 mg)', 'Azicip', 'Antibiotics'),
  // Not sold under these names, so they must never appear.
  med('Tadalafil 20 mg Tablet', 'Cialis Generic'),
  med('Azithromycin Tablets', 'Intas', 'Antibiotics'),
  med('Doxycycline Capsules IP 100 mg', '', 'Antibiotics'),
];

function mockCatalogue(body, ok = true) {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok, json: async () => body, text: async () => 'error' });
}

const renderMarquee = () =>
  render(
    <MemoryRouter>
      <BrandMarquee />
    </MemoryRouter>
  );

beforeEach(() => mockCatalogue(catalogue));

describe('brandsFromCatalogue', () => {
  it('keeps only brands the product is sold under, once each', () => {
    const names = brandsFromCatalogue(catalogue).map((b) => b.name);
    expect(names.sort()).toEqual(['Azicip', 'Cenforce', 'Fildena', 'Iverheal', 'Lexaheal', 'Ocumoist', 'Tadalista']);
  });

  it('spreads each category along the strip instead of bunching it', () => {
    const mixed = [
      ...['Alpha', 'Bravo', 'Charlie', 'Delta'].map((b) => med(`${b} 10 mg`, b, 'ED')),
      ...['Echo', 'Foxtrot'].map((b) => med(`${b} 10 mg`, b, 'Eye Care')),
    ];
    expect(brandsFromCatalogue(mixed).map((b) => b.icon)).toEqual(['capsule', 'eye', 'capsule', 'capsule', 'eye', 'capsule']);
  });

  it('copes with a bad payload', () => {
    expect(brandsFromCatalogue(null)).toEqual([]);
    expect(brandsFromCatalogue([null, {}])).toEqual([]);
    expect(catalogueStats(null)).toEqual({ products: 0, brands: 0, categories: 0 });
  });
});

describe('catalogueStats', () => {
  it('counts what is actually on the site', () => {
    expect(catalogueStats(catalogue)).toEqual({ products: 11, brands: 7, categories: 5 });
  });
});

describe('BrandMarquee', () => {
  it('shows real catalogue brands with a truthful heading and no company claims', async () => {
    renderMarquee();
    expect(await screen.findByRole('heading', { name: '7+ brands in our catalogue' })).toBeInTheDocument();
    expect(screen.queryByText(/trusted by/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Cialis Generic')).not.toBeInTheDocument();
    expect(screen.getByText(/belong to their respective owners/i)).toBeInTheDocument();
  });

  it('links each brand to the shop search, once for keyboards and screen readers', async () => {
    renderMarquee();
    const link = await screen.findByRole('link', { name: 'Tadalista' });
    expect(link).toHaveAttribute('href', '/shop?search=Tadalista');
    expect(screen.getAllByRole('link')).toHaveLength(7);

    const copies = document.querySelectorAll('.brand-marquee-copy a');
    expect(copies).toHaveLength(7);
    copies.forEach((a) => expect(a).toHaveAttribute('tabindex', '-1'));
  });

  it('hides itself when the catalogue has too few brands', async () => {
    mockCatalogue(catalogue.slice(0, 3));
    const { container } = renderMarquee();
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('hides itself when the catalogue cannot load', async () => {
    mockCatalogue('down', false);
    const { container } = renderMarquee();
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
