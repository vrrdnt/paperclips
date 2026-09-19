import { tr, translate } from '../i18n';
import { useLocale } from '../i18n/react';
import { X } from 'lucide-react';
import { CHANGELOG, formatChangelogCommits } from '../changelog';
import { Btn } from './ui/Btn';
import { Dialog } from './ui/Dialog';

interface Props {
  onClose: () => void;
}

export function ChangelogModal({ onClose }: Props) {
  useLocale();
  return (
    <Dialog title={tr("changelogModal.changelog")} className="changelog-dialog" onClose={onClose}>
        <div className="changelog-modal-head">
          <div>
            <div className="changelog-title">{tr("changelogModal.changelog")}</div>
            <div className="changelog-subtitle">{tr("changelogModal.versionHistory")}</div>
          </div>
          <Btn onClick={onClose} title={tr("changelogModal.closeChangelog")} aria-label={tr("changelogModal.closeChangelog")}>
            <X size={13} />
          </Btn>
        </div>

        <div className="changelog-list">
          {CHANGELOG.map(entry => (
            <section className="changelog-entry" key={entry.version}>
              <div className="changelog-entry-head">
                <span className="changelog-version">{tr("changelogModal.v", { version: entry.version })}</span>
                <span className="changelog-date">{entry.date}</span>
              </div>
              <div className="changelog-entry-title">{translate(entry.title)}</div>
              <div className="changelog-commits">{tr("changelogModal.commits", { entry: formatChangelogCommits(entry) })}</div>
              <ul>
                {entry.changes.map((change, index) => (
                  <li key={index}>{translate(change)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
    </Dialog>
  );
}
