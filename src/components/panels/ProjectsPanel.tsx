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
  if (activeProjects.length === 0) return null;

  return (
    <SectionCard title="Projects" icon={<FlaskConical size={14} />}>
      <div className="project-list">
        {activeProjects.map((p: Project) => {
          const canAfford = p.cost(s);
          return (
            <Btn
              key={p.id}
              className="project-btn"
              disabled={!canAfford}
              onClick={() => { p.effect(G); }}
            >
              <span className="project-btn-title">{p.title}</span>
              <span className="project-btn-price">{p.priceTag}</span>
              <span className="project-btn-desc">{p.description}</span>
            </Btn>
          );
        })}
      </div>
    </SectionCard>
  );
}
