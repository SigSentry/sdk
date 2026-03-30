import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisWidget, type AnalysisWidgetProps } from './AnalysisWidget.js';

export interface SigSentryTriggerProps extends AnalysisWidgetProps {
  mode?: 'modal' | 'slideout';
  label?: string;
}

const s = {
  trigger: {
    padding: '10px 20px',
    borderRadius: 'var(--tb-border-radius)',
    border: 'none',
    backgroundColor: 'var(--tb-color-primary)',
    color: 'var(--tb-color-primary-text)',
    fontFamily: 'var(--tb-font-family)',
    fontSize: 'var(--tb-font-size-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
  } as React.CSSProperties,
  modalWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 24,
  } as React.CSSProperties,
  modalContent: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 600,
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    backgroundColor: 'var(--tb-color-bg)',
    borderRadius: 'var(--tb-border-radius)',
    border: '1px solid var(--tb-color-border)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
  } as React.CSSProperties,
  slideoutContent: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    width: 420,
    maxWidth: '100%',
    height: '100%',
    overflowY: 'auto' as const,
    backgroundColor: 'var(--tb-color-bg)',
    borderLeft: '1px solid var(--tb-color-border)',
    boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,
  close: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: 'var(--tb-color-text-secondary)',
    lineHeight: 1,
    padding: 4,
    zIndex: 1,
  } as React.CSSProperties,
};

export function SigSentryTrigger({
  mode = 'modal',
  label = 'Analyze Error',
  className,
  ...widgetProps
}: SigSentryTriggerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const isModal = mode === 'modal';

  return (
    <>
      <button type="button" style={s.trigger} className={className} onClick={open}>
        {label}
      </button>

      {isOpen && (
        <div
          style={s.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          role="dialog"
          aria-modal="true"
        >
          {isModal ? (
            <div style={s.modalWrap} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
              <div style={s.modalContent}>
                <button type="button" style={s.close} onClick={close} aria-label="Close">&times;</button>
                <AnalysisWidget {...widgetProps} />
              </div>
            </div>
          ) : (
            <div style={s.slideoutContent}>
              <button type="button" style={s.close} onClick={close} aria-label="Close">&times;</button>
              <AnalysisWidget {...widgetProps} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
