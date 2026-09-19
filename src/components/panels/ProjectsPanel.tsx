import { FlaskConical } from 'lucide-react';
import { SectionCard } from '../ui/SectionCard';
import { Btn } from '../ui/Btn';
import { DisplaySnapshot } from '../../store/useGameStore';
import { game } from '../../game/runtime';
import { purchaseProject, getActiveProjects, Project } from '../../game/projects';
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
  const title = typeof p.title === 'function' ? p.title(s) : p.title;
  const priceTag = typeof p.priceTag === 'function' ? p.priceTag(s) : p.priceTag;

  return (
    <div
      className={[
        'project-reveal',
        isHighlighted ? 'is-reveal-highlighted' : '',
        canAfford ? 'is-affordable' : '',
      ].filter(Boolean).join(' ')}
      data-reveal-id={revealKey}
      onMouseEnter={acknowledgeReveal}
      onPointerDown={acknowledgeReveal}
      onFocusCapture={acknowledgeReveal}
    >
      <Btn
        className="project-btn"
        aria-label={`${title} ${priceTag} ${p.description}`}
        disabled={!canAfford}
        onClick={() => {
          if (p.id === 217 && !window.confirm('Are you sure you want to restart?')) return;
          game.act(purchaseProject, p.id);
        }}
      >
        <span className="project-btn-title">{title}</span>
        <span className="project-btn-price">{priceTag}</span>
      </Btn>
      <div className="project-details">
        <div className="project-btn-desc">{p.description}</div>
      </div>
    </div>
  );
}

export function ProjectsPanel({ snap: s }: Props) {
  if (!s.projectsFlag) return null;
  if (s.dismantle >= 7) return null;

  const activeProjects = getActiveProjects(s)
    .map((project) => ({
      project,
      canAfford: project.cost(s),
    }));

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
