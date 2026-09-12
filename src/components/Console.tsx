import { memo, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { SectionCard } from './ui/SectionCard';

interface Props { readouts: readonly string[]; }

export const Console = memo(function Console({ readouts }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFirst = useRef<string>('');

  useEffect(() => {
    const latest = readouts[0] ?? '';
    if (latest !== prevFirst.current) {
      prevFirst.current = latest;
      if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [readouts]);

  return (
    <SectionCard title="Log" icon={<Terminal size={14} />}>
      <div className="console-panel" ref={panelRef}>
        {[...readouts].reverse().map((line, i) => (
          <div key={i} className="console-line">{line || ' '}</div>
        ))}
      </div>
    </SectionCard>
  );
});
