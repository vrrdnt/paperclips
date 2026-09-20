import { tr } from '../i18n';
import { useLocale } from '../i18n/react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Factory, Cpu, FlaskConical, Swords, Rocket } from 'lucide-react';
import { PanelVisibility } from './ui/PanelVisibility';
import { Console } from './Console';
import { BusinessPanel } from './panels/BusinessPanel';
import { ManufacturingPanel } from './panels/ManufacturingPanel';
import { ComputingPanel } from './panels/ComputingPanel';
import { QuantumPanel } from './panels/QuantumPanel';
import { ProjectsPanel } from './panels/ProjectsPanel';
import { InvestmentPanel } from './panels/InvestmentPanel';
import { StrategyPanel } from './panels/StrategyPanel';
import { WireProductionPanel, SpaceExplorationPanel } from './panels/SpacePanel';
import { ProbeDesignPanel } from './panels/ProbeDesignPanel';
import { PowerPanel } from './panels/PowerPanel';
import { SwarmPanel } from './panels/SwarmPanel';
import { CombatPanel } from './panels/CombatPanel';
import type { DisplaySnapshot } from '../store/useGameStore';

type Section = 'Production' | 'Computing' | 'Projects' | 'Strategy' | 'Fleet';
const sectionLabels = {"Production":"sections.production","Computing":"sections.computing","Projects":"sections.projects","Strategy":"sections.strategy","Fleet":"sections.fleet"} as const;
const sectionIcons = { Production: Factory, Computing: Cpu, Projects: FlaskConical, Strategy: Swords, Fleet: Rocket };

/** Panel placement and navigation are presentation state, never part of a save. */
export function GameLayout({ snap: s }: { snap: DisplaySnapshot }) {
  useLocale();
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [selected, setSelected] = useState<Section>('Production');
  const scrollPositions = useRef<Partial<Record<Section, number>>>({});
  const previous = useRef({ mobile, selected });
  const tabRefs = useRef<Partial<Record<Section, HTMLButtonElement | null>>>({});
  const navRef = useRef<HTMLElement>(null);
  const [navigationHeight, setNavigationHeight] = useState(60);
  const postHuman = s.humanFlag === 0;
  const space = s.spaceFlag === 1;
  const computing = !!s.compFlag && s.dismantle < 7;
  const quantum = s.qFlag === 1 && !(s.dismantle >= 5 && s.endTimer4 >= 250);
  const swarm = !!s.swarmFlag && !(s.dismantle >= 2 && s.endTimer2 >= 150);
  const strategy = !!s.strategyEngineFlag && s.dismantle < 4;
  const investment = !!s.investmentEngineFlag && !!s.humanFlag;
  const exploration = space && !(s.dismantle >= 1 && s.endTimer1 >= 150);
  const design = space && (s.dismantle < 1 || s.endTimer1 < 50 || (s.projectFlags[121] === 1 && s.endTimer1 < 100));
  const combat = !!s.battleFlag && !(s.dismantle >= 1 && s.endTimer1 >= 190);
  const sections: Section[] = ['Production'];
  if (computing || quantum || swarm) sections.push('Computing');
  if (s.projectsFlag && s.dismantle < 7) sections.push('Projects');
  if (strategy || investment) sections.push('Strategy');
  if (space && (exploration || design || combat)) sections.push('Fleet');
  const active = sections.includes(selected) ? selected : 'Production';
  const hasTabs = sections.length > 1;

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => setNavigationHeight(nav.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [mobile, hasTabs]);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const change = () => setMobile(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useLayoutEffect(() => {
    if (selected !== active) {
      setSelected(active);
      tabRefs.current[active]?.focus({ preventScroll: true });
    }
    if (mobile && (previous.current.selected !== active || !previous.current.mobile)) {
      window.scrollTo(0, scrollPositions.current[active] ?? 0);
    }
    previous.current = { mobile, selected: active };
  }, [active, selected, mobile]);
  useEffect(() => {
    if (!mobile) return;
    const remember = () => {
      // A taller column layout may clamp scroll before React handles the media change.
      // Do not overwrite the section's phone position with that desktop scroll event.
      if (window.matchMedia('(max-width: 767px)').matches) scrollPositions.current[active] = window.scrollY;
    };
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [active, mobile]);

  function select(section: Section) {
    if (section === active) return;
    scrollPositions.current[active] = window.scrollY;
    setSelected(section);
  }
  function panel(section: Section, node: ReactNode, key: string) {
    const visible = !mobile || active === section;
    return <PanelVisibility.Provider value={visible} key={key}>
      <div className="game-panel-slot" data-section={section} hidden={!visible}>{node}</div>
    </PanelVisibility.Provider>;
  }
  const businessPanel = panel('Production', <BusinessPanel snap={s} />, 'business');
  const wirePanel = panel('Production', <WireProductionPanel snap={s} />, 'wire');
  const explorationPanel = panel('Fleet', <SpaceExplorationPanel snap={s} />, 'exploration');
  const designPanel = panel('Fleet', <ProbeDesignPanel snap={s} />, 'design');
  const swarmPanel = panel('Computing', <SwarmPanel snap={s} />, 'swarm');
  const powerPanel = panel('Production', <PowerPanel snap={s} />, 'power');
  const combatPanel = panel('Fleet', <CombatPanel snap={s} />, 'combat');

  return (
    <div className={hasTabs ? 'app-wrap has-section-tabs' : 'app-wrap'}
      style={mobile && hasTabs ? { paddingBottom: navigationHeight + 15 } : undefined}>
      <div className="app-console"><Console readouts={s.readouts} /></div>
      {mobile && hasTabs && <nav ref={navRef} className="section-tabs" role="tablist" aria-label={tr("gameLayout.gameSections")}>
        {sections.map((section, index) => {
          const Icon = sectionIcons[section];
          return <button key={section} id={`section-tab-${section}`} ref={element => { tabRefs.current[section] = element; }}
            type="button" role="tab" aria-selected={active === section} aria-controls="game-section-panel"
            tabIndex={active === section ? 0 : -1} onClick={() => select(section)}
            onKeyDown={event => {
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1
                : event.key === 'ArrowRight' ? (index + 1) % sections.length
                : event.key === 'ArrowLeft' ? (index + sections.length - 1) % sections.length : -1;
              if (next < 0) return;
              event.preventDefault();
              select(sections[next]);
              tabRefs.current[sections[next]]?.focus({ preventScroll: true });
            }}><Icon size={18} aria-hidden="true" /><span>{tr(sectionLabels[section])}</span></button>;
        })}
      </nav>}
      <main id="game-section-panel" className={`app-body app-body-${postHuman ? space ? 'phase3' : 'phase2' : 'human'}`}
        role={mobile && hasTabs ? 'tabpanel' : undefined}
        aria-labelledby={mobile && hasTabs ? `section-tab-${active}` : undefined}
        tabIndex={mobile && hasTabs ? 0 : undefined}>
        <div className="col-left">
          {businessPanel}
          {postHuman ? <>{wirePanel}{space && <>{explorationPanel}{designPanel}</>}</> : panel('Production', <ManufacturingPanel snap={s} />, 'manufacturing')}
        </div>
        <div className="col-center">
          {panel('Computing', <ComputingPanel snap={s} />, 'computing')}
          {postHuman && swarmPanel}
          {panel('Computing', <QuantumPanel snap={s} />, 'quantum')}
          {panel('Projects', <ProjectsPanel snap={s} />, 'projects')}
        </div>
        <div className="col-right">
          {panel('Strategy', <StrategyPanel snap={s} />, 'strategy')}
          {!postHuman && <>{panel('Strategy', <InvestmentPanel snap={s} />, 'investment')}{wirePanel}{explorationPanel}{designPanel}</>}
          {(!postHuman || !space) && powerPanel}
          {!postHuman && swarmPanel}
          {(!postHuman || space) && combatPanel}
        </div>
      </main>

        <footer style={{ textAlign: 'center', padding: '16px 0 4px', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>{tr("gameLayout.basedOn")}{' '}
          <a href="https://www.decisionproblem.com/paperclips/" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>{tr("gameLayout.universalPaperclips")}</a>
          {' '}{tr("gameLayout.byFrankLantzAmpNyuGameCenterAll")}{' '}|{' '}
          <a href="https://github.com/vrrdnt/paperclips" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>{tr("gameLayout.vrrdntPaperclips")}</a>
          {' '}|{' '}
          <a href="/privacy.html"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>{tr("gameLayout.privacyPolicy")}</a>
        </footer>
    </div>
  );
}
