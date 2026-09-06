import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Percent,
  Sparkles,
  Layers,
  Tag,
  CheckCircle2,
  Receipt,
  ScanBarcode,
} from 'lucide-react';
import { formatCurrency, calculateTax } from '../../utils/formatters';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const POSView = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartItemQty,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    cartDiscount,
    setCartDiscount,
    currency,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saleType, setSaleType] = useState('finished_product');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState({}); // { [productId]: { size, color } }
  
  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const cartRef = useRef(null);

  const finishedCategories = [
    'All',
    'Formal Shirts',
    'Suits & Blazers',
    'Trousers & Chinos',
    'Denims',
    'Ethnic & Festive',
    'Accessories',
  ];
  const rawCategories = ['All', 'Raw Fabrics', 'Raw Materials', 'Threads & Trims', 'Lining'];
  const categories = saleType === 'raw_material' ? rawCategories : finishedCategories;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesType = saleType === 'raw_material'
      ? ['Raw Fabrics', 'Raw Materials', 'Threads & Trims', 'Lining'].includes(p.category)
      : !['Raw Fabrics', 'Raw Materials', 'Threads & Trims', 'Lining'].includes(p.category);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      String(p.name || '').toLowerCase().includes(q) ||
      String(p.sku || '').toLowerCase().includes(q) ||
      String(p.barcode || '').toLowerCase().includes(q) ||
      String(p.brand || '').toLowerCase().includes(q) ||
      String(p.fabric || '').toLowerCase().includes(q);
    return matchesType && matchesCat && matchesSearch;
  });

  // Calculate Cart Totals
  const rawSubtotal = cart.reduce((acc, item) => {
    const itemPriceAfterDiscount = item.price * (1 - (item.discount || 0) / 100);
    return acc + itemPriceAfterDiscount * item.quantity;
  }, 0);

  const overallDiscountAmount = (rawSubtotal * cartDiscount) / 100;
  const subtotalAfterDiscount = rawSubtotal - overallDiscountAmount;
  const taxAmount = (subtotalAfterDiscount * 12) / 100; // 12% GST
  const grandTotal = subtotalAfterDiscount + taxAmount;

  const handleVariantChange = (productId, field, value) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleProductAdd = (product) => {
    const variant = selectedVariants[product.id] || {
      size: product.sizes?.[0] || 'Standard',
      color: product.colors?.[0] || 'Default',
    };
    addToCart(product, variant);
  };

  const handleOrderSuccess = (order) => {
    setCompletedOrder(order);
    setIsReceiptOpen(true);
  };

  return (
    <div className="view-container">
      {/* Top Banner */}
      <div className="responsive-header-row">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{saleType === 'raw_material' ? 'Raw Material Sales POS' : 'Finished Product Sales POS'}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            High-speed billing terminal with garment variant selection, barcode scan, and instant invoice printing
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => setIsScannerOpen(true)}>
            <ScanBarcode size={16} />
            Hardware Barcode Scanner
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button className={`btn ${saleType === 'finished_product' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setSaleType('finished_product'); setSelectedCategory('All'); clearCart(); }}>
          <Tag size={15} /> Finished Products
        </button>
        <button className={`btn ${saleType === 'raw_material' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setSaleType('raw_material'); setSelectedCategory('All'); clearCart(); }}>
          <Layers size={15} /> Raw Materials
        </button>
      </div>

      {/* POS Layout Split */}
      <div className="pos-container">
        {/* Left: Garment Catalog & Variants */}
        <div className="pos-catalog-section">
          {/* Search & Category Pills */}
          <div className="pos-filters-bar">
            <div className="pos-search-input">
              <Search size={18} className="pos-search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search garment by name, SKU, fabric (e.g. Silk, Denim, 89010...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="pos-category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="garment-grid">
            {filteredProducts.map((prod) => {
              const currentVariant = selectedVariants[prod.id] || {
                size: prod.sizes?.[0] || 'Standard',
                color: prod.colors?.[0] || 'Default',
              };
              const isLowStock = prod.stock <= (prod.minStock || 5);

              return (
                <div key={prod.id} className="garment-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="garment-emoji">{prod.image || '👔'}</div>
                    <span
                      className={`stock-pill ${
                        prod.stock === 0
                          ? 'badge-danger'
                          : isLowStock
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} ${prod.unit || 'in stock'}`}
                    </span>
                  </div>

                  <h3 className="garment-card-title">{prod.name}</h3>
                  <div className="garment-meta">
                    <span style={{ color: 'var(--primary)' }}>{prod.sku}</span> • {prod.fabric || prod.brand}
                  </div>

                  {/* Size & Color Selectors */}
                  <div className="garment-variant-selects">
                    <div>
                      <select
                        className="form-select"
                        style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                        value={currentVariant.size}
                        onChange={(e) => handleVariantChange(prod.id, 'size', e.target.value)}
                      >
                        {prod.sizes?.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        className="form-select"
                        style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                        value={currentVariant.color}
                        onChange={(e) => handleVariantChange(prod.id, 'color', e.target.value)}
                      >
                        {prod.colors?.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="garment-price-row">
                    <div>
                      <div className="price-text">{formatCurrency(prod.price, currency)}</div>
                      {prod.mrp && prod.mrp > prod.price && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                          {formatCurrency(prod.mrp, currency)}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleProductAdd(prod)}
                      disabled={prod.stock <= 0}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Mobile Ticket Bar for Fast Counter Checkout on Mobile */}
          {cart.length > 0 && (
            <div className="mobile-ticket-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ticket ({cart.reduce((a, b) => a + b.quantity, 0)} Items)</div>
                  <strong style={{ fontSize: '0.92rem', color: '#10B981' }}>
                    {formatCurrency(grandTotal, currency)}
                  </strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Ticket
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  Pay Now →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Cart & Ticket Summary */}
        <div ref={cartRef} className="pos-cart-sidebar">
          <div className="cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Current Ticket</h3>
              <span className="badge badge-primary">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
            </div>
            {cart.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={clearCart}
                style={{ color: '#F43F5E', padding: '3px 8px', fontSize: '0.75rem' }}
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          {/* Cart Item Rows */}
          <div className="cart-items-list">
            {cart.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-dim)',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ fontSize: '0.85rem' }}>No garments added to ticket.</p>
                <p style={{ fontSize: '0.75rem' }}>Select variants from the catalog or scan barcodes.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="cart-item-row">
                  <div className="cart-item-top">
                    <div>
                      <div className="cart-item-name">{item.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                          Size: {item.size}
                        </span>{' '}
                        • {item.color}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="cart-item-controls">
                    {/* Quantity counter */}
                    <div className="qty-counter">
                      <button className="qty-btn" onClick={() => updateCartItemQty(index, -1)}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button className="qty-btn" onClick={() => updateCartItemQty(index, 1)}>
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Item Discount % */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Disc %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-input"
                        style={{ width: '45px', padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }}
                        value={item.discount || 0}
                        onChange={(e) => updateCartItemDiscount(index, e.target.value)}
                      />
                    </div>

                    {/* Line total */}
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(item.price * item.quantity * (1 - (item.discount || 0) / 100), currency)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Checkout */}
          <div className="cart-summary-box">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(rawSubtotal, currency)}</span>
            </div>

            {/* Overall Ticket Discount */}
            <div className="summary-row" style={{ alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Percent size={12} /> Bill Discount:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  style={{ width: '50px', padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }}
                  value={cartDiscount}
                  onChange={(e) => setCartDiscount(Number(e.target.value) || 0)}
                />
                <span className="font-mono" style={{ color: '#F43F5E' }}>
                  -{formatCurrency(overallDiscountAmount, currency)}
                </span>
              </div>
            </div>

            <div className="summary-row">
              <span>Tax / GST (12%):</span>
              <span className="font-mono">{formatCurrency(taxAmount, currency)}</span>
            </div>

            <div className="summary-row summary-total">
              <span>Total Payable:</span>
              <span style={{ color: '#10B981' }} className="font-mono">
                {formatCurrency(grandTotal, currency)}
              </span>
            </div>

            <button
              className="btn btn-success btn-lg"
              style={{ width: '100%', marginTop: '12px' }}
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
            >
              <CheckCircle2 size={18} />
              Proceed to Tender ({formatCurrency(grandTotal, currency)})
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotalAfterDiscount}
        discountTotal={overallDiscountAmount}
        tax={taxAmount}
        grandTotal={grandTotal}
        saleType={saleType}
        onSuccessOrder={handleOrderSuccess}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={completedOrder}
        currency={currency}
      />
    </div>
  );
};
