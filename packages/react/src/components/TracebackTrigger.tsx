import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisWidget, type AnalysisWidgetProps } from './AnalysisWidget.js';

export interface SigSentryTriggerProps extends AnalysisWidgetProps {
  mode?: 'modal' | 'slideout';
  label?: string;
}

const styles = {
  triggerButton: {
    padding: 'calc(var(--sg-spacing-unit) * 3) calc(var(--sg-spacing-unit) * 5)',
    borderRadius: 'var(--sg-border-radius)',
    border: 'none',
    backgroundColor: 'var(--sg-color-primary)',
    color: '#ffffff',
    fontFamily: 'var(--sg-font-family)',
    fontSize: 'var(--sg-font-size-base)',
    fontWeight: 600,
    cursor: 'pointer',
  } satisfies React.CSSProperties,
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    zIndex: 9999,
  } satisfies React.CSSProperties,
  modalOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies React.CSSProperties,
  slideoutOverlay: {
    justifyContent: 'flex-end',
  } satisfies React.CSSProperties,
  modalContent: {
    width: '90%',
    maxWidth: '680px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    backgroundColor: 'var(--sg-color-bg)',
    borderRadius: 'var(--sg-border-radius)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  } satisfies React.CSSProperties,
  slideoutContent: {
    width: '420px',
    maxWidth: '100%',
    height: '100%',
    overflowY: 'auto' as const,
    backgroundColor: 'var(--sg-color-bg)',
    boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.15)',
  } satisfies React.CSSProperties,
  closeButton: {
    position: 'absolute' as const,
    top: 'calc(var(--sg-spacing-unit) * 3)',
    right: 'calc(var(--sg-spacing-unit) * 3)',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--sg-color-text-secondary)',
    lineHeight: 1,
    padding: 'calc(var(--sg-spacing-unit) * 1)',
  } satisfies React.CSSProperties,
  contentWrapper: {
    position: 'relative' as const,
  } satisfies React.CSSProperties,
} as const;

export function SigSentryTrigger({
  mode = 'modal',
  label = 'Analyze Error',
  className,
  ...widgetProps
}: SigSentryTriggerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const isModal = mode === 'modal';

  return (
    <>
      <button
        type="button"
        style={styles.triggerButton}
        className={className}
        onClick={open}
      >
        {label}
      </button>

      {isOpen && (
        <div
          style={{
            ...styles.overlay,
            ...(isModal ? styles.modalOverlay : styles.slideoutOverlay),
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div style={{ ...(isModal ? styles.modalContent : styles.slideoutContent), ...styles.contentWrapper }}>
            <button
              type="button"
              style={styles.closeButton}
              onClick={close}
              aria-label="Close"
            >
              &times;
            </button>
            <AnalysisWidget {...widgetProps} />
          </div>
        </div>
      )}
    </>
  );
}
