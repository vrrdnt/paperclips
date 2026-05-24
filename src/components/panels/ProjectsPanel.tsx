import React from 'react';
import { FlaskConical } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { getActiveProjects, Project } from '../../game/projects';

interface Props { snap: DisplaySnapshot; }

export function ProjectsPanel({ snap: s }: Props) {
  if (!s.projectsFlag) return null;

  const activeProjects = getActiveProjects(s);

  return (
    <SectionCard title="Projects" icon={<FlaskConical size={14} />}>
      {activeProjects.length === 0 ? (
        <div className="empty-state">No active projects</div>
      ) : (
        <div className="project-list">
          {activeProjects.map((p: Project) => {
            const canAfford = p.cost(s);
            const priceTag = typeof p.priceTag === 'function' ? p.priceTag(s) : p.priceTag;
            return (
              <Btn
                key={p.id}
                className="project-btn"
                disabled={!canAfford}
                onClick={() => { p.effect(G); }}
              >
                <span className="project-btn-title">{p.title}</span>
                <span className="project-btn-price">{priceTag}</span>
                <span className="project-btn-desc">{p.description}</span>
              </Btn>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
