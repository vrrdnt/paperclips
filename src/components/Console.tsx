import { tr, translate } from '../i18n';
import type { LocalizedText } from '../i18n/message';
import { useLocale } from '../i18n/react';
import { memo, useId, useLayoutEffect, useRef, useState } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';
import { Btn } from './ui/Btn';
import { Dialog } from './ui/Dialog';

interface Props { readouts: readonly LocalizedText[]; }

export const Console = memo(function Console({ readouts }: Props) {
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const previewId = useId();
  const historyRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  useLayoutEffect(() => {
    if (expanded && followLatest.current && historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [readouts, expanded, locale]);

  return (
    <>
      <Btn className="console-open" aria-label={tr("console.fullHistory")} aria-describedby={previewId} aria-haspopup="dialog" aria-expanded={expanded}
        onClick={() => { followLatest.current = true; setExpanded(true); }}>
          <span className="console-heading">
            <span className="console-title"><Terminal size={14} aria-hidden="true" />{tr("console.log")}</span>
            <span className="console-history-label">{tr("console.fullHistory2")}<ChevronRight size={14} aria-hidden="true" /></span>
          </span>
          <span className="console-preview" id={previewId}>
            <span className="console-preview-viewport">
              <span className="console-preview-content">
                {/* Each entry occupies at least one line, so only the latest three can be visible. */}
                {readouts.slice(0, 3).reverse().map((line, i) => (
                  <span key={i} className="console-line">{translate(line) || '\u00a0'}</span>
                ))}
              </span>
            </span>
          </span>
      </Btn>
      {expanded && (
        <Dialog title={tr("console.logHistory")} className="log-dialog" onClose={() => setExpanded(false)}>
          <div className="dialog-heading"><h2>{tr("console.logHistory")}</h2><Btn className="dialog-close" onClick={() => setExpanded(false)}>{tr("console.close")}</Btn></div>
          <div className="log-history" ref={historyRef} tabIndex={0} aria-label={tr("console.logEntries")}
            onScroll={event => {
              const el = event.currentTarget;
              followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
            }}>
            {[...readouts].reverse().map((line, i) => <div key={i} className="console-line">{translate(line) || '\u00a0'}</div>)}
          </div>
        </Dialog>
      )}
    </>
  );
});
