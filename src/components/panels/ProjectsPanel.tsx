import React from 'react';
import { FlaskConical } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { G } from '../../game/state';
import { getActiveProjects, Project } from '../../game/projects';
import { useRevealHighlight } from '../ui/useRevealHighlight';

interface Props { snap: DisplaySnapshot; }

interface ProjectButtonProps {
  project: Project;
  snap: DisplaySnapshot;
  canAfford: boolean;
}

function ProjectButton({ project: p, snap: s, canAfford }: ProjectButtonProps) {
  const revealKey = `project:${p.id}`;
  const { isHighlighted, acknowledgeReveal } = useRevealHighlight(revealKey);
  const priceTag = typeof p.priceTag === 'function' ? p.priceTag(s) : p.priceTag;

  return (
    <div
      className={`project-reveal ${isHighlighted ? 'is-reveal-highlighted' : ''}`}
      data-reveal-id={revealKey}
      onMouseEnter={acknowledgeReveal}
      onPointerDown={acknowledgeReveal}
      onFocusCapture={acknowledgeReveal}
    >
      <Btn
        className="project-btn"
        disabled={!canAfford}
        onClick={() => { p.effect(G); }}
      >
        <span className="project-btn-title">{p.title}</span>
        <span className="project-btn-price">{priceTag}</span>
        <span className="project-btn-desc">{p.description}</span>
      </Btn>
    </div>
  );
}

export function ProjectsPanel({ snap: s }: Props) {
  if (!s.projectsFlag) return null;

  const activeProjects = getActiveProjects(s)
    .map((project, index) => ({
      project,
      index,
      canAfford: project.cost(s),
    }))
    .sort((a, b) => Number(b.canAfford) - Number(a.canAfford) || a.index - b.index);

  return (
    <SectionCard title="Projects" icon={<FlaskConical size={14} />}>
      {activeProjects.length === 0 ? (
        <div className="empty-state">No active projects</div>
      ) : (
        <div className="project-list">
          {activeProjects.map(({ project, canAfford }) => (
            <ProjectButton
              key={project.id}
              project={project}
              snap={s}
              canAfford={canAfford}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
