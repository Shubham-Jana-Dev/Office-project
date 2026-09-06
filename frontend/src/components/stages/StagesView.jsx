import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GitBranch,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Layers,
  Scissors,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  Package,
} from 'lucide-react';
import { STAGES_LIST } from '../../data/seedData';
import { formatDate } from '../../utils/formatters';
import { NewBatchModal } from './NewBatchModal';
import { QCModal } from './QCModal';
import { StatCard } from '../common/StatCard';

export const StagesView = () => {
  const { productStages, advanceProductStage, moveProductStageBackward } = useApp();
  const [selectedStage, setSelectedStage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [selectedBatchForQC, setSelectedBatchForQC] = useState(null);

  const getNextStageInfo = (currentStageName) => {
    const currentIndex = STAGES_LIST.findIndex((s) => s.name === currentStageName);
    if (currentIndex > -1 && currentIndex < STAGES_LIST.length - 1) {
      const nextStage = STAGES_LIST[currentIndex + 1];
      const progressVal = Math.round(((currentIndex + 2) / STAGES_LIST.length) * 100);
      return { nextStageName: nextStage.name, progressVal };
    }
    return null;
  };

  const handleAdvance = (batch) => {
    const nextInfo = getNextStageInfo(batch.currentStage);
    if (nextInfo) {
      advanceProductStage(batch.id, nextInfo.nextStageName, nextInfo.progressVal);
    }
  };

  const getPreviousStageInfo = (currentStageName) => {
    const currentIndex = STAGES_LIST.findIndex((stage) => stage.name === currentStageName);
    if (currentIndex > 0) {
      const previousStage = STAGES_LIST[currentIndex - 1];
      const progressVal = Math.round((currentIndex / STAGES_LIST.length) * 100);
      return { previousStageName: previousStage.name, progressVal };
    }
    return null;
  };

  const handleMoveBackward = (batch) => {
    const previousInfo = getPreviousStageInfo(batch.currentStage);
    if (previousInfo) {
      moveProductStageBackward(batch.id, previousInfo.previousStageName, previousInfo.progressVal);
    }
  };

  // KPI Calculations
  const totalBatches = productStages.length;
  const totalPieces = productStages.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  const inQCOrReady = productStages.filter(
    (b) => b.currentStage.includes('QC') || b.currentStage.includes('Showroom')
  ).length;
  const activeInProduction = totalBatches - inQCOrReady;

  // Filtered Stages to display
  const displayedStages =
    selectedStage === 'All'
      ? STAGES_LIST
      : STAGES_LIST.filter((s) => s.name === selectedStage);

  // Filter batches by search query
  const getFilteredBatchesForStage = (stageName) => {
    return productStages.filter((b) => {
      const inThisStage = b.currentStage === stageName;
      if (!inThisStage) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.batchNo?.toLowerCase().includes(q) ||
        b.garmentType?.toLowerCase().includes(q) ||
        b.clientName?.toLowerCase().includes(q) ||
        b.assignedTo?.toLowerCase().includes(q) ||
        b.fabricCode?.toLowerCase().includes(q) ||
        b.bookingNo?.toLowerCase().includes(q)
      );
    });
  };

  return (
    <div className="view-container">
      {/* Responsive Header Row */}
      <div className="responsive-header-row">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Product Stages & Manufacturing Lifecycle</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time stage tracking from Fabric Inward &rarr; Cutting &rarr; Stitching &rarr; Embroidery &rarr; Finishing &rarr; QC &rarr; Showroom
          </p>
        </div>
        <div className="responsive-header-actions">
          <button className="btn btn-primary" onClick={() => setIsNewBatchOpen(true)}>
            <Plus size={16} /> Initiate Production Batch
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="stats-grid">
        <StatCard
          label="Active Production Batches"
          value={totalBatches}
          icon={Layers}
          color="#6366F1"
          trend={`${totalPieces} total pieces in line`}
          trendPositive={true}
        />
        <StatCard
          label="In Fabrication & Stitching"
          value={activeInProduction}
          icon={Scissors}
          color="#F59E0B"
          trend="WIP active on floor"
          trendPositive={true}
        />
        <StatCard
          label="QC & Showroom Stock"
          value={inQCOrReady}
          icon={CheckCircle2}
          color="#10B981"
          trend="Passed / Inspection stage"
          trendPositive={true}
        />
        <StatCard
          label="Total Garment Units"
          value={`${totalPieces} Pcs`}
          icon={Package}
          color="#06B6D4"
          trend="Total workload quantity"
          trendPositive={true}
        />
      </div>

      {/* Stage Categories & Search Filter Bar (Responsive for Mobile & Desktop) */}
      <div className="pos-filters-bar stages-filters-bar">
        <div className="pos-search-input stages-search-input">
          <Search size={18} className="pos-search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search batch ID, client, garment type, tailor master..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pos-category-pills stages-category-pills">
          <button
            className={`category-pill stage-cat-pill ${selectedStage === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedStage('All')}
          >
            <span>All Stages</span>
            <span className="stage-pill-count">{totalBatches}</span>
          </button>

          {STAGES_LIST.map((stage) => {
            const count = productStages.filter((b) => b.currentStage === stage.name).length;
            const isSelected = selectedStage === stage.name;
            return (
              <button
                key={stage.id}
                className={`category-pill stage-cat-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedStage(stage.name)}
                style={
                  isSelected
                    ? { borderColor: stage.color, boxShadow: `0 2px 10px ${stage.color}40` }
                    : {}
                }
              >
                <span>{stage.icon}</span>
                <span>{stage.name}</span>
                <span
                  className="stage-pill-count"
                  style={isSelected ? { background: 'rgba(255,255,255,0.25)', color: '#FFF' } : {}}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban Board Container */}
      <div
        className={`stages-kanban-board ${
          selectedStage !== 'All' ? 'single-stage-view' : 'multi-stage-view'
        }`}
      >
        {displayedStages.map((stage) => {
          const batchesInStage = getFilteredBatchesForStage(stage.name);

          return (
            <div
              key={stage.id}
              className={`stage-column ${selectedStage !== 'All' ? 'single-column-active' : ''}`}
            >
              {/* Stage Header */}
              <div
                className="stage-column-header"
                style={{
                  borderTop: `3px solid ${stage.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{stage.icon}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFF' }}>
                    {stage.name}
                  </span>
                </div>
                <span
                  className="badge badge-primary"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                >
                  {batchesInStage.length} {batchesInStage.length === 1 ? 'Lot' : 'Lots'}
                </span>
              </div>

              {/* Batches inside this stage */}
              <div className="stage-column-body">
                {batchesInStage.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '36px 14px',
                      color: 'var(--text-dim)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px', opacity: 0.6 }}>
                      {stage.icon}
                    </div>
                    {searchQuery ? 'No matching lots found' : 'No lots currently in this stage'}
                  </div>
                ) : (
                  batchesInStage.map((batch) => {
                    const nextInfo = getNextStageInfo(batch.currentStage);
                    const previousInfo = getPreviousStageInfo(batch.currentStage);
                    return (
                      <div key={batch.id} className="stage-batch-card">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {batch.batchNo}
                          </span>
                          <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                            {batch.quantity} Pcs
                          </span>
                        </div>

                        <h4
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: '#FFF',
                            marginBottom: '4px',
                          }}
                        >
                          {batch.garmentType}
                        </h4>

                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Client: <strong style={{ color: 'var(--text-main)' }}>{batch.clientName}</strong>
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                            marginTop: '2px',
                          }}
                        >
                          Master: {batch.assignedTo}
                        </div>

                        {/* Progress Bar */}
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${batch.progress || 20}%` }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.72rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          <span>Target: {formatDate(batch.targetDate)}</span>
                          <span>{batch.progress || 20}%</span>
                        </div>

                        {batch.qcStatus && (
                          <div style={{ marginTop: '8px' }}>
                            <span
                              className={`badge ${
                                batch.qcStatus.includes('Passed')
                                  ? 'badge-success'
                                  : batch.qcStatus.includes('Rework')
                                  ? 'badge-warning'
                                  : 'badge-primary'
                              }`}
                              style={{ fontSize: '0.68rem' }}
                            >
                              {batch.qcStatus}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                          {stage.id === 6 && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ flex: '1 1 120px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.75rem', padding: '6px 8px' }}
                              onClick={() => setSelectedBatchForQC(batch)}
                            >
                              <ShieldCheck size={14} color="#10B981" /> QC Check
                            </button>
                          )}

                          {nextInfo && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ flex: '1 1 120px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.75rem', padding: '6px 8px' }}
                              onClick={() => handleAdvance(batch)}
                              title={`Advance to ${nextInfo.nextStageName}`}
                            >
                              Next Stage <ArrowRight size={14} />
                            </button>
                          )}

                          {previousInfo && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ flex: '1 1 120px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.75rem', padding: '6px 8px' }}
                              onClick={() => handleMoveBackward(batch)}
                              title={`Move back to ${previousInfo.previousStageName}`}
                            >
                              <ArrowLeft size={14} /> Previous Stage
                            </button>
                          )}

                          {stage.id === 7 && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#10B981',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
                              <CheckCircle2 size={16} /> In Showroom Stock
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
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
