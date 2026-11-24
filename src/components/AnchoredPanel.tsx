import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface AnchoredPanelProps {
  /** The control the panel belongs to; the panel is placed under it. */
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  /** Which anchor edge the panel's left/right edge lines up with. */
  align?: 'left' | 'right';
  /** Gap between the anchor and the panel, in px. */
  gap?: number;
  /** Forwarded to the panel element: the caller's outside-click check needs it. */
  panelRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  children: ReactNode;
}

/**
 * A dropdown panel that is *not* clipped by its trigger's scroll container.
 *
 * The stage toolbar scrolls horizontally to stay one row, and a scroll container
 * clips every descendant — including an absolutely positioned menu. Menus opened
 * from it were laid out correctly and painted nowhere, which reads as a button
 * that does nothing. Rendering into `document.body` with fixed coordinates keeps
 * the panel above the preview iframe and out of any `overflow: hidden` between it
 * and the trigger.
 *
 * The panel element is exposed through `panelRef` so the caller can keep treating
 * clicks inside it as "inside" when deciding whether to close.
 */
export function AnchoredPanel({
  anchor,
  open,
  align = 'left',
  gap = 8,
  panelRef,
  className = '',
  children,
}: AnchoredPanelProps) {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const width = internalRef.current?.offsetWidth ?? 0;
      const maxLeft = window.innerWidth - width - 8;
      const raw = align === 'right' ? rect.right - width : rect.left;
      setPos({ top: rect.bottom + gap, left: Math.max(8, Math.min(raw, Math.max(8, maxLeft))) });
    };
    place();
    // The trigger moves when the toolbar scrolls or the window resizes.
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align, gap, anchor]);

  // Re-place once the panel has its real width (the first pass runs before layout).
  useLayoutEffect(() => {
    if (!open || !pos) return;
    const rect = anchor.current?.getBoundingClientRect();
    const width = internalRef.current?.offsetWidth;
    if (!rect || !width) return;
    const raw = align === 'right' ? rect.right - width : rect.left;
    const left = Math.max(8, Math.min(raw, Math.max(8, window.innerWidth - width - 8)));
    if (left !== pos.left) setPos({ top: pos.top, left });
  }, [open, pos, align, anchor]);

  useEffect(() => {
    if (!open) return;
    internalRef.current?.focus?.();
  }, [open]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={(node) => {
        internalRef.current = node;
        if (panelRef) panelRef.current = node;
      }}
      data-any3d-panel=""
      style={{ position: 'fixed', top: pos.top, left: pos.left }}
      className={className}
    >
      {children}
    </div>,
    document.body,
  );
}
