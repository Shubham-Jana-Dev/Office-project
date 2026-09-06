import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { PackagePlus } from 'lucide-react';

export const ProductModal = ({ isOpen, onClose, onProductCreated, initialName = '' }) => {
  const { addProduct } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bespoke & Custom');
  const [price, setPrice] = useState('0');

  useEffect(() => {
    if (isOpen) setName(initialName || '');
  }, [isOpen, initialName]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const product = await addProduct({ name, category, price });
    onProductCreated?.(product);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Garment / Product" maxWidth="520px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label className="form-label">Garment / Product Name</label>
          <input
            className="form-input"
            required
            autoFocus
            placeholder="e.g. Bespoke Tuxedo, Italian Wool Fabric"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Category</label>
          <input
            className="form-input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Starting Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-input"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg">
          <PackagePlus size={18} /> Add Product
        </button>
      </form>
    </Modal>
  );
};