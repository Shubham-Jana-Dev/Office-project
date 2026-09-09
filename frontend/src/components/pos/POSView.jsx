import React from 'react';
import { TailorCounterView } from './TailorCounterView';

export const POSView = ({ onNavigateToHistory }) => {
  return (
    <div className="view-container">
      <TailorCounterView onNavigateToHistory={onNavigateToHistory} />
    </div>
  );
};
