import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/** Native focus containment plus a same-page Back entry for browser/TWA overlays. */
export function Dialog({ title, onClose, children, className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const marker = crypto.randomUUID();
    let disposed = false;
    let pushed = false;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    // React StrictMode's trial mount must not create a history entry.
    queueMicrotask(() => {
      if (disposed) return;
      history.pushState({ ...history.state, paperclipsOverlay: marker }, '');
      pushed = true;
    });
    const back = () => {
      if (history.state?.paperclipsOverlay === marker) return;
      pushed = false;
      closeRef.current();
    };
    const viewport = window.visualViewport;
    const resize = () => {
      dialog.style.setProperty('--viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      dialog.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`);
    };
    resize();
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    window.addEventListener('popstate', back);
    return () => {
      disposed = true;
      window.removeEventListener('popstate', back);
      viewport?.removeEventListener('resize', resize);
      viewport?.removeEventListener('scroll', resize);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (pushed && history.state?.paperclipsOverlay === marker) history.back();
      const target = trigger?.isConnected && trigger !== document.body
        ? trigger : document.querySelector<HTMLElement>('[data-header-actions]');
      target?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={ref} className={`game-dialog ${className}`} aria-label={title}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      } }}>
      {children}
    </dialog>
  );
}
