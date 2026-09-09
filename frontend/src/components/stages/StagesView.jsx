import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Search,
  Layers,
  Scissors,
  CheckCircle2,
  Package,
  Filter,
  Truck,
} from 'lucide-react';
import { STAGES_LIST } from '../../data/seedData';
import { NewBatchModal } from './NewBatchModal';
import { QCModal } from './QCModal';
import { StatCard } from '../common/StatCard';

const STAGE_LABELS = ['Cutting', 'Stitching', 'Hemming', 'QC', 'Ready to Deliver'];

const ALTERATION_STAGES_LIST = [
  { id: 101, name: 'Received', status: 'pending' },
  { id: 102, name: 'Fixing in Progress', status: 'pending' },
  { id: 103, name: 'QC Check', status: 'pending' },
  { id: 104, name: 'Ready to Deliver', status: 'pending' }
];
const ALTERATION_STAGE_LABELS = ['Received', 'Fixing', 'QC', 'Ready to Deliver'];

export const StagesView = () => {
  const { productStages, orderBookings, advanceProductStage, moveProductStageBackward, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [selectedBatchForQC, setSelectedBatchForQC] = useState(null);

  // Helper: check if a batch is an alteration
  const isAlterationBatch = (batch) => {
    if (batch.garmentType?.toLowerCase().includes('alteration')) return true;
    const order = orderBookings?.find(o => o.id === batch.bookingId);
    return order?.orderType === 'ALTERATION';
  };

  const getActiveStageList = (batch) => isAlterationBatch(batch) ? ALTERATION_STAGES_LIST : STAGES_LIST;
  const getActiveStageLabels = (batch) => isAlterationBatch(batch) ? ALTERATION_STAGE_LABELS : STAGE_LABELS;

  // Helper: get the 0-based index of a batch's current stage
  const getStageIndex = (batch, currentStage) => {
    if (currentStage === 'Delivered') {
      return getActiveStageList(batch).length; // beyond last stage
    }
    const list = getActiveStageList(batch);
    const idx = list.findIndex((s) => s.name === currentStage);
    return idx >= 0 ? idx : 0;
  };

  // Handle clicking a checkbox node – toggle check/uncheck
  const handleNodeClick = (batch, clickedIndex) => {
    const list = getActiveStageList(batch);
    const currentIdx = getStageIndex(batch, batch.currentStage);
    if (batch.currentStage === 'Delivered') return; // can't modify delivered items via nodes

    if (clickedIndex <= currentIdx) {
      // UNCHECK: clicking a completed or current stage → move back to stage before it
      if (clickedIndex === 0) {
        // Can't go before stage 0, set to stage 0
        const firstStage = list[0];
        const progressVal = Math.round((1 / list.length) * 100);
        moveProductStageBackward(batch.id, firstStage.name, progressVal);
      } else {
        // Move back to the stage before the clicked one
        const prevStage = list[clickedIndex - 1];
        const progressVal = Math.round((clickedIndex / list.length) * 100);
        moveProductStageBackward(batch.id, prevStage.name, progressVal);
      }
    } else {
      // CHECK: clicking a future stage → advance to it
      const targetStage = list[clickedIndex];
      const progressVal = Math.round(((clickedIndex + 1) / list.length) * 100);
      advanceProductStage(batch.id, targetStage.name, progressVal);
    }
  };

  // Mark as delivered
  const handleDeliver = (batch) => {
    advanceProductStage(batch.id, 'Delivered', 100);
    if (showToast) showToast(`Order ${batch.batchNo || batch.id} marked as Delivered! 🎉`, 'success');
  };

  // KPI Calculations
  const totalBatches = productStages.length;
  const totalPieces = productStages.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  const inQCOrReady = productStages.filter(
    (b) => b.currentStage?.includes('QC') || b.currentStage?.includes('Ready')
  ).length;
  const activeInProduction = totalBatches - inQCOrReady;

  // Filter by search and stage
  const filteredBatches = productStages.filter((b) => {
    if (filterStage !== 'All') {
      if (filterStage === 'Delivered') {
        if (b.currentStage !== 'Delivered') return false;
      } else {
        const list = getActiveStageList(b);
        const stageObj = list.find((s) => s.name === filterStage);
        if (!stageObj) return false;
        if (b.currentStage !== stageObj.name) return false;
      }
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.batchNo?.toLowerCase().includes(q) ||
      b.id?.toLowerCase().includes(q) ||
      b.garmentType?.toLowerCase().includes(q) ||
      b.clientName?.toLowerCase().includes(q) ||
      b.assignedTo?.toLowerCase().includes(q) ||
      b.fabricCode?.toLowerCase().includes(q) ||
      b.bookingNo?.toLowerCase().includes(q)
    );
  });

  // Get status badge
  const getStatusInfo = (batch) => {
    const list = getActiveStageList(batch);
    const labels = getActiveStageLabels(batch);
    const idx = getStageIndex(batch, batch.currentStage);
    if (batch.currentStage === 'Delivered') {
      return { text: 'Delivered', className: 'tracker-status-delivered' };
    }
    if (idx === list.length - 1) {
      return { text: 'Ready to Deliver', className: 'tracker-status-ready' };
    }
    if (idx >= list.length - 2) {
      return { text: 'QC', className: 'tracker-status-qc' };
    }
    return { text: labels[idx] || 'In Progress', className: 'tracker-status-progress' };
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="responsive-header-row">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Production Tracker
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Track every product through Cutting → Stitching → Hemming → QC → Ready to Deliver
          </p>
        </div>
        <div className="responsive-header-actions">
          <button className="btn btn-primary" onClick={() => setIsNewBatchOpen(true)}>
            <Plus size={16} /> New Production Batch
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard label="Total Batches" value={totalBatches} icon={Layers} color="#6366F1" trend={`${totalPieces} total pieces`} trendPositive={true} />
        <StatCard label="In Production" value={activeInProduction} icon={Scissors} color="#F59E0B" trend="Cutting / Stitching / Hemming" trendPositive={true} />
        <StatCard label="QC & Ready" value={inQCOrReady} icon={CheckCircle2} color="#10B981" trend="Quality check & delivery" trendPositive={true} />
        <StatCard label="Total Pieces" value={`${totalPieces} Pcs`} icon={Package} color="#06B6D4" trend="Across all batches" trendPositive={true} />
      </div>

      {/* Search & Filter Bar */}
      <div className="tracker-filter-bar">
        <div className="tracker-search-box">
          <Search size={18} className="tracker-search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by batch ID, customer, product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="tracker-stage-filters">
          <Filter size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {['All', ...STAGES_LIST.map((s) => s.name)].map((stage) => (
            <button
              key={stage}
              className={`tracker-filter-pill ${filterStage === stage ? 'active' : ''}`}
              onClick={() => setFilterStage(stage)}
            >
              {stage === 'All' ? 'All' : STAGE_LABELS[STAGES_LIST.findIndex((s) => s.name === stage)] || stage}
            </button>
          ))}
        </div>
      </div>

      {/* Tracker Cards List */}
      <div className="tracker-cards-list">
        {filteredBatches.length === 0 ? (
          <div className="tracker-empty-state">
            <Package size={48} strokeWidth={1} />
            <h3>No products found</h3>
            <p>{searchQuery ? 'Try a different search term' : 'No production batches match the selected filter'}</p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const list = getActiveStageList(batch);
            const labels = getActiveStageLabels(batch);
            const currentIdx = getStageIndex(batch, batch.currentStage);
            const isDelivered = batch.currentStage === 'Delivered';
            const statusInfo = getStatusInfo(batch);
            const isReadyToDeliver = batch.currentStage === 'Ready to Delivery stage' || batch.currentStage === 'Ready to Deliver';

            // Find matching order to display payment info
            const order = orderBookings?.find(o => o.id === batch.bookingId);
            const advancePaid = order?.advancePaid || 0;
            const dueAmount = order?.balanceDue || 0;

            return (
              <div key={batch.id} className={`tracker-card ${isDelivered ? 'tracker-card-delivered' : ''}`}>
                {/* Card Header: Product Info */}
                <div className="tracker-card-header">
                  <div className="tracker-card-info">
                    <div className="tracker-card-icon">
                      <Package size={22} />
                    </div>
                    <div className="tracker-card-details">
                      <div className="tracker-card-id">{batch.batchNo || batch.id}</div>
                      <div className="tracker-card-name">{batch.garmentType}</div>
                      <div className="tracker-card-meta">
                        <span>Customer: <strong>{batch.clientName}</strong></span>
                        <span className="tracker-meta-sep">•</span>
                        <span>Qty: <strong>{batch.quantity} Pcs</strong></span>
                        {batch.assignedTo && (
                          <>
                            <span className="tracker-meta-sep">•</span>
                            <span>Assigned: <strong>{batch.assignedTo}</strong></span>
                          </>
                        )}
                        <span className="tracker-meta-sep">•</span>
                        <span style={{ color: '#059669' }}>Adv: <strong>₹{advancePaid}</strong></span>
                        <span className="tracker-meta-sep">•</span>
                        <span style={{ color: '#ea580c' }}>Due: <strong>₹{dueAmount}</strong></span>
                      </div>
                      
                      {isAlterationBatch(batch) && batch.notes && (
                        <div style={{ marginTop: '8px', padding: '6px 8px', background: '#fef3c7', borderLeft: '3px solid #f59e0b', fontSize: '12px', color: '#92400e', borderRadius: '4px' }}>
                          <strong>Notes:</strong> {batch.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`tracker-status-badge ${statusInfo.className}`}>
                    {statusInfo.text}
                  </div>
                </div>

                {/* Stage Tracker: Horizontal stepper with real checkbox-style nodes */}
                <div className="tracker-stepper">
                  {list.map((stage, idx) => {
                    const isChecked = isDelivered || idx < currentIdx || idx === currentIdx;
                    const isCompleted = isDelivered || idx < currentIdx;
                    const isCurrent = !isDelivered && idx === currentIdx;

                    return (
                      <React.Fragment key={stage.id}>
                        {/* Stage Step */}
                        <div className="tracker-step">
                          <label
                            className={`tracker-cb-label ${isChecked ? 'checked' : ''} ${isCurrent ? 'current' : ''} ${isDelivered ? 'delivered-all' : ''}`}
                            title={
                              isDelivered
                                ? 'Delivered'
                                : isChecked
                                ? `Uncheck ${labels[idx]} (move back)`
                                : `Check ${labels[idx]} (advance to this stage)`
                            }
                          >
                            <input
                              type="checkbox"
                              className="tracker-cb-input"
                              checked={isChecked}
                              disabled={isDelivered}

                              onChange={() => {
                                try {
                                  handleNodeClick(batch, idx);
                                } catch (err) {
                                  console.error('Stage update failed:', err);
                                }
                              }}
                            />
                            <span className="tracker-cb-box">
                              {isChecked && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                          </label>
                          <span className={`tracker-step-label ${isCurrent ? 'active-label' : ''} ${isCompleted ? 'completed-label' : ''}`}>
                            {labels[idx]}
                          </span>

                          {/* Delivered button under "Ready to Deliver" node */}
                          {idx === list.length - 1 && isReadyToDeliver && !isDelivered && (
                            <button
                              className="tracker-deliver-btn"
                              onClick={() => handleDeliver(batch)}
                            >
                              <Truck size={13} /> Delivered
                            </button>
                          )}

                          {/* Show "Delivered ✓" badge if delivered, under last node */}
                          {idx === list.length - 1 && isDelivered && (
                            <div className="tracker-delivered-badge">
                              <CheckCircle2 size={13} /> Delivered
                            </div>
                          )}
                        </div>

                        {/* Connector Line */}
                        {idx < list.length - 1 && (
                          <div className={`tracker-connector ${isCompleted ? 'completed' : ''}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* QC status badge (if present) */}
                {batch.qcStatus && (
                  <div className="tracker-card-footer">
                    <span
                      className={`badge ${
                        batch.qcStatus.includes('Passed')
                          ? 'badge-success'
                          : batch.qcStatus.includes('Rework')
                          ? 'badge-warning'
                          : 'badge-primary'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      QC: {batch.qcStatus}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <NewBatchModal isOpen={isNewBatchOpen} onClose={() => setIsNewBatchOpen(false)} />
      <QCModal
        isOpen={Boolean(selectedBatchForQC)}
        onClose={() => setSelectedBatchForQC(null)}
        batch={selectedBatchForQC}
      />
    </div>
  );
};
