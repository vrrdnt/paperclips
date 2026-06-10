import { X } from 'lucide-react';
import { CHANGELOG, formatChangelogCommits } from '../changelog';
import { Btn } from './ui/Btn';

interface Props {
  onClose: () => void;
}

export function ChangelogModal({ onClose }: Props) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="changelog-modal" role="dialog" aria-modal="true" aria-label="Changelog">
        <div className="changelog-modal-head">
          <div>
            <div className="changelog-title">Changelog</div>
            <div className="changelog-subtitle">Version history</div>
          </div>
          <Btn onClick={onClose} title="Close changelog" aria-label="Close changelog">
            <X size={13} />
          </Btn>
        </div>

        <div className="changelog-list">
          {CHANGELOG.map(entry => (
            <section className="changelog-entry" key={entry.version}>
              <div className="changelog-entry-head">
                <span className="changelog-version">v{entry.version}</span>
                <span className="changelog-date">{entry.date}</span>
              </div>
              <div className="changelog-entry-title">{entry.title}</div>
              <div className="changelog-commits">Commits {formatChangelogCommits(entry)}</div>
              <ul>
                {entry.changes.map(change => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
