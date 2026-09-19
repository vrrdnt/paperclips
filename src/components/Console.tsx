import { memo, useId, useLayoutEffect, useRef, useState } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';
import { Btn } from './ui/Btn';
import { Dialog } from './ui/Dialog';

interface Props { readouts: readonly string[]; }

export const Console = memo(function Console({ readouts }: Props) {
  const [expanded, setExpanded] = useState(false);
  const previewId = useId();
  const historyRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  useLayoutEffect(() => {
    if (expanded && followLatest.current && historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [readouts, expanded]);

  return (
    <>
      <Btn className="console-open" aria-label="Full history" aria-describedby={previewId} aria-haspopup="dialog" aria-expanded={expanded}
        onClick={() => { followLatest.current = true; setExpanded(true); }}>
          <span className="console-heading">
            <span className="console-title"><Terminal size={14} aria-hidden="true" /> Log</span>
            <span className="console-history-label">Full history <ChevronRight size={14} aria-hidden="true" /></span>
          </span>
          <span className="console-preview" id={previewId}>
            {readouts.slice(0, 3).reverse().map((line, i) => (
              <span key={i} className="console-line">{line || '\u00a0'}</span>
            ))}
          </span>
      </Btn>
      {expanded && (
        <Dialog title="Log history" className="log-dialog" onClose={() => setExpanded(false)}>
          <div className="dialog-heading"><h2>Log history</h2><Btn onClick={() => setExpanded(false)}>Close</Btn></div>
          <div className="log-history" ref={historyRef} tabIndex={0} aria-label="Log entries"
            onScroll={event => {
              const el = event.currentTarget;
              followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
            }}>
            {[...readouts].reverse().map((line, i) => <div key={i} className="console-line">{line || '\u00a0'}</div>)}
          </div>
        </Dialog>
      )}
    </>
  );
});
