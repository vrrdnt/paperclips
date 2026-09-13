import { memo, useLayoutEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import { SectionCard } from './ui/SectionCard';
import { Btn } from './ui/Btn';
import { Dialog } from './ui/Dialog';

interface Props { readouts: readonly string[]; }

export const Console = memo(function Console({ readouts }: Props) {
  const [expanded, setExpanded] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  useLayoutEffect(() => {
    if (expanded && followLatest.current && historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [readouts, expanded]);

  return (
    <>
      <SectionCard title="Log" icon={<Terminal size={14} />}>
        <div className="console-summary">
          <div className="console-preview">
            {readouts.slice(0, 3).reverse().map((line, i) => (
              <div key={i} className="console-line">{line || '\u00a0'}</div>
            ))}
          </div>
          <Btn aria-haspopup="dialog" aria-expanded={expanded}
            onClick={() => { followLatest.current = true; setExpanded(true); }}>Full history</Btn>
        </div>
      </SectionCard>
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
