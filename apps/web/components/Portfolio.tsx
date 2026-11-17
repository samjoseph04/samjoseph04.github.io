'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Menu,
  Search,
  X,
} from 'lucide-react';
import type { Portfolio as Content } from '@portfolio/content';
import Brand from './Brand';
import BrandMark from './BrandMark';
import EducationTimeline from './EducationTimeline';
import Games from './Games';
import ExperienceControls from './ExperienceControls';
import InteractionLayer from './InteractionLayer';
import { MagneticContent, SectionLight } from './InteractionContent';
import CinematicText from './CinematicText';
import CinematicMotion from './CinematicMotion';
import ThemeToggle from './ThemeToggle';
import { cinema } from '../lib/cinematic';

function SectionHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="section-heading">
      <div className="heading-line">
        <h2>
          <CinematicText text={title} />
        </h2>
        {children}
      </div>
    </div>
  );
}

function ProjectDrawing({ index }: { index: number }) {
  return (
    <div className={`project-drawing drawing-${index}`} aria-hidden="true">
      {index === 0 ? (
        <>
          <div className="drawing-browser">
            <div className="browser-bar">
              <i />
              <i />
              <i />
              <span>PART-TIME WORK PORTAL</span>
            </div>
            <div className="browser-body">
              <span className="mono">FIND YOUR NEXT OPPORTUNITY</span>
              <strong>
                Work that fits
                <br />
                your world.
              </strong>
              <div className="draw-search">
                <Search size={13} />
                <span>Search opportunities</span>
                <ArrowRight size={14} />
              </div>
              <div className="draw-jobs">
                {['LOCAL OPPORTUNITIES', 'FOR STUDENTS', 'FOR EMPLOYERS'].map((s) => (
                  <div key={s}>
                    <span className="mini-block" />
                    <span>
                      {s}
                      <i />
                    </span>
                    <ArrowUpRight size={14} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <span className="drawing-caption mono">INTERFACE CONCEPT / NOT A PROJECT SCREENSHOT</span>
        </>
      ) : (
        <>
          <div className="map-grid">
            <svg viewBox="0 0 600 370" fill="none">
              <path
                d="M-20 300L160 110H330L470-20M100 400L330 170H620M-20 80H90L310 300H620M500 400V270L370 140V-20"
                stroke="currentColor"
                strokeWidth="24"
              />
              <path
                d="M130 275L230 175H380L460 95"
                stroke="var(--paper)"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
              <circle cx="130" cy="275" r="12" fill="var(--paper)" />
              <circle cx="460" cy="95" r="12" fill="var(--paper)" />
              <circle cx="130" cy="275" r="4" fill="var(--tone-deep)" />
              <circle cx="460" cy="95" r="4" fill="var(--tone-deep)" />
            </svg>
            <div className="route-card">
              <span className="mono">CARPOOLING MANAGEMENT</span>
              <strong>
                A better way
                <br />
                to get there.
              </strong>
              <div>
                <span>DRIVER</span>
                <ArrowRight size={18} />
                <span>RIDER</span>
              </div>
            </div>
          </div>
          <span className="drawing-caption mono">SYSTEM CONCEPT / NOT A PROJECT SCREENSHOT</span>
        </>
      )}
    </div>
  );
}

function Project({ project, index }: { project: Content['projects'][number]; index: number }) {
  return (
    <article className={`project project-${index % 2}`}>
      <div className="project-visual" data-reveal="image">
        {project.image ? (
          <img
            src={project.image}
            alt={`${project.title} screenshot`}
            loading="lazy"
            width={1000}
            height={700}
          />
        ) : (
          <ProjectDrawing index={index % 2} />
        )}
      </div>
      <div className="project-copy">
        <div className="project-index mono" data-reveal="enter">
          <span>0{index + 1}</span>
          <span>{project.category}</span>
          <Code2 size={17} />
        </div>
        <h3>
          <CinematicText text={project.title} />
        </h3>
        <p>
          <CinematicText text={project.description} delay={0.08} />
        </p>
        <div className="tags" data-reveal="enter" data-reveal-delay="0.16">
          {project.technologies.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="project-actions" data-reveal="enter" data-reveal-delay="0.2">
          {project.repository ? (
            <a
              href={project.repository}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="VIEW"
              data-magnetic="3"
            >
              <MagneticContent>
                View source <ArrowUpRight size={17} />
              </MagneticContent>
            </a>
          ) : (
            <span className="placeholder-inline">Repository link to be added</span>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="VIEW"
              data-magnetic="3"
            >
              <MagneticContent>
                Live project <ArrowUpRight size={17} />
              </MagneticContent>
            </a>
          )}
        </div>
        <details className="case-study">
          <summary>
            Behind the build <ChevronDown size={16} />
          </summary>
          <div>
            <h4>The problem</h4>
            <p>{project.problem}</p>
            <h4>The approach</h4>
            <p>{project.approach}</p>
            <h4>What I learned</h4>
            <ul>
              {project.learning.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </article>
  );
}

function Timeline({ items, empty }: { items: Content['experience']; empty: string }) {
  if (!items.length)
    return (
      <div className="empty-timeline" data-reveal="enter">
        <span className="mono">[ DETAILS TO BE ADDED ]</span>
        <p>{empty}</p>
      </div>
    );
  return (
    <div className="timeline">
      {items.map((item) => (
        <article key={item.id} data-reveal="enter">
          <span className="mono timeline-period">{item.period || 'Dates to be added'}</span>
          <div>
            <h3>{item.title}</h3>
            <span className={item.organization ? 'organization' : 'placeholder-inline'}>
              {item.organization || 'Institution / organization to be added'}
            </span>
            <p>{item.description}</p>
          </div>
          <span aria-hidden="true">↗</span>
        </article>
      ))}
    </div>
  );
}

export default function Portfolio({
  content,
  preview = false,
}: {
  content: Content;
  preview?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const interactionRoot = useRef<HTMLDivElement>(null);
  const { personal, resume } = content;
  const nav = [
    ['About', '#about'],
    ['Work', '#projects'],
    ['Play', '#games'],
    ['Contact', '#contact'],
  ];
  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(false);
        navRef.current?.querySelector<HTMLButtonElement>('.menu-button')?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menu]);
  const year = 2026;
  return (
    <MotionConfig reducedMotion="user">
      <div className="portfolio-root" ref={interactionRoot}>
        {!preview && <InteractionLayer rootRef={interactionRoot} />}
        {!preview && <CinematicMotion rootRef={interactionRoot} />}
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <nav className="navigation page-width" aria-label="Main navigation" ref={navRef}>
            <Brand name={personal.name} />
            <div className="desktop-nav">
              {nav.map(([label, href]) => (
                <a key={href} href={href} data-magnetic="3">
                  <MagneticContent>{label}</MagneticContent>
                </a>
              ))}
            </div>
            <a className="nav-contact" href="#contact" data-magnetic="4">
              <MagneticContent>
                Let’s talk <ArrowUpRight size={17} />
              </MagneticContent>
            </a>
            <ThemeToggle />
            <button
              className="menu-button"
              aria-label={menu ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menu}
              aria-controls="mobile-navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </nav>
          <ExperienceControls />
          <AnimatePresence>
            {menu && (
              <motion.div
                id="mobile-navigation"
                className="mobile-nav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.3, ease: cinema.ease }}
              >
                {[...nav, ['Experience', '#experience'], ['Education', '#education']].map(
                  ([label, href], index) => (
                    <motion.a
                      key={href}
                      href={href}
                      onClick={() => setMenu(false)}
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduce ? 0 : 0.45,
                        delay: reduce ? 0 : index * 0.035,
                        ease: cinema.ease,
                      }}
                    >
                      {label}
                      <ArrowUpRight size={20} />
                    </motion.a>
                  ),
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <noscript>
            <nav className="noscript-nav">
              {nav.map(([label, href]) => (
                <a href={href} key={href}>
                  {label}
                </a>
              ))}
            </nav>
          </noscript>
        </header>
        <main id="main">
          <section id="home" className="hero page-width section-surface surface-dark">
            <div className="hero-composition">
              <div className="hero-name">
                <h1>
                  <span>
                    <CinematicText text={personal.name.split(' ')[0]} characters />
                  </span>
                  <span>
                    <CinematicText
                      text={personal.name.split(' ').slice(1).join(' ')}
                      characters
                      delay={0.12}
                    />
                    <i data-reveal="enter" data-reveal-delay="0.4">.</i>
                  </span>
                </h1>
                <div className="hero-role" data-reveal="enter" data-reveal-delay="0.3">
                  <span className="small-cross" aria-hidden="true">
                    ✳
                  </span>
                  <p>
                    {personal.role}
                    <br />
                    <span>Turning ideas into working systems.</span>
                  </p>
                </div>
              </div>
              <figure className="hero-portrait">
                {personal.portrait ? (
                  <div className="portrait-frame">
                    <span className="hero-portrait-image" data-reveal="image" data-reveal-delay="0.1">
                      <img
                        src={personal.portrait}
                        srcSet={
                          !preview && personal.portrait === '/assets/sam-joseph-portrait.webp'
                            ? '/assets/sam-joseph-portrait-720.webp 720w, /assets/sam-joseph-portrait-1200.webp 1200w, /assets/sam-joseph-portrait.webp 1800w'
                            : undefined
                        }
                        sizes="(max-width: 560px) calc(100vw - 40px), 46vw"
                        alt={personal.portraitAlt}
                        width={2979}
                        height={2383}
                        fetchPriority="high"
                      />
                      <span className="portrait-tone" aria-hidden="true" />
                    </span>
                  </div>
                ) : (
                  <div className="portrait-placeholder">[ PORTRAIT TO BE ADDED ]</div>
                )}
                <figcaption className="mono" data-reveal="enter" data-reveal-delay="0.3">
                  <span>01 / THE PERSON BEHIND THE CODE</span>
                  <span>© SJ</span>
                </figcaption>
              </figure>
            </div>
            <div className="hero-bottom">
              <p>
                <CinematicText text={personal.introduction} delay={0.2} />
              </p>
              <a
                href="#projects"
                className="round-link"
                data-cursor="VIEW"
                data-reveal="enter"
                data-reveal-delay="0.3"
              >
                <span>Explore my work</span>
                <span className="round-icon" data-magnetic="4">
                  <MagneticContent>
                    <ArrowDown size={23} />
                  </MagneticContent>
                </span>
              </a>
            </div>
          </section>

          <section id="about" className="about-section section-shell section-surface surface-dark">
            <SectionHeading title="Curiosity is the starting point." />
            <div className="about-grid">
              <span className="about-symbol" aria-hidden="true" data-reveal="accent">
                <span>*</span>
              </span>
              <div className="about-copy">
                <p className="large-copy">
                  <CinematicText text="I like understanding how things work." />
                  <br />
                  <span>
                    <CinematicText text="Then building something useful." delay={0.12} />
                  </span>
                </p>
                <p>
                  <CinematicText text={personal.about} delay={0.08} />
                </p>
                <div className="about-links" data-reveal="enter" data-reveal-delay="0.2">
                  {resume.file ? (
                    <a
                      className="button button-light"
                      href={preview ? resume.file : '/resume.pdf'}
                      download="Sam-Joseph-Resume.pdf"
                      data-cursor="GET"
                      data-magnetic="4"
                    >
                      <MagneticContent>
                        {resume.label}
                        <ArrowDownToLine size={17} />
                      </MagneticContent>
                    </a>
                  ) : (
                    <span className="resume-unavailable">
                      <ArrowDownToLine size={18} />
                      <span>
                        Resume <small>PDF to be added</small>
                      </span>
                    </span>
                  )}
                  <a className="text-link" href="#education" data-magnetic="3">
                    <MagneticContent>
                      My journey <ArrowUpRight size={17} />
                    </MagneticContent>
                  </a>
                </div>
              </div>
              <aside className="about-note mono" data-reveal="enter" data-reveal-delay="0.15">
                <span>THE APPROACH</span>
                <p>
                  Understand the problem.
                  <br />
                  Build with purpose.
                  <br />
                  Learn from the process.
                </p>
                <span className="tiny-cross" aria-hidden="true">
                  +
                </span>
              </aside>
            </div>
          </section>

          <section
            id="projects"
            className="projects-section section-shell section-surface surface-dark"
          >
            <SectionHeading title="Built to solve something." />
            {content.projects.map((project, index) => (
              <Project key={project.id} project={project} index={index} />
            ))}
            {!content.projects.length && (
              <p className="placeholder-inline">Projects to be added.</p>
            )}
          </section>

          <Games games={content.games} />

          <section
            id="experience"
            className="section-shell journey-section section-surface surface-dark"
          >
            <SectionHeading title="Learning by doing." />
            <Timeline
              items={content.experience}
              empty="Experience details will be added here. In the meantime, explore my project work above."
            />
          </section>

          <section
            id="education"
            className="section-shell education-section section-surface surface-dark"
          >
            <SectionHeading title="The foundations." />
            <EducationTimeline items={content.education} />
          </section>

          <section
            id="contact"
            className="contact-section section-shell section-surface surface-dark"
            data-interactive-light=""
          >
            <SectionLight />
            <h2>
              <CinematicText text="Good things start" />
              <br />
              <CinematicText text="with a" delay={0.08} />{' '}
              <em><CinematicText text="conversation." delay={0.16} /></em>
              <ArrowUpRight aria-hidden="true" />
            </h2>
            <div className="contact-bottom" data-reveal="enter" data-reveal-delay="0.15">
              <p>
                Have an idea, a question, or a project in mind?
                <br />
                Let’s connect and see where it goes.
              </p>
              <div className="contact-actions">
                {personal.email ? (
                  <>
                    <a
                      className="button button-light"
                      href={`mailto:${personal.email}`}
                      data-magnetic="4"
                    >
                      <MagneticContent>
                        Say hello <ArrowUpRight size={20} />
                      </MagneticContent>
                    </a>
                    <button
                      className="copy-email"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(personal.email);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch {
                          setCopied(false);
                        }
                      }}
                      aria-label="Copy email address"
                    >
                      {copied ? <Check size={17} /> : 'Copy email'}
                    </button>
                    <span className="sr-only" aria-live="polite">
                      {copied ? 'Email copied' : ''}
                    </span>
                  </>
                ) : (
                  <div className="contact-placeholder mono">
                    EMAIL TO BE ADDED
                    <br />
                    <span>Connect through the links below.</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
        <footer className="site-footer page-width">
          <a className="footer-logo" href="#home" aria-label="Back to top">
            <BrandMark className="footer-monogram" />
          </a>
          <p className="mono">
            © {year} {personal.name.toUpperCase()}
          </p>
          <div className="social-links">
            {personal.github && (
              <a href={personal.github} target="_blank" rel="noopener noreferrer">
                <Code2 size={16} />
                GitHub <ArrowUpRight size={13} />
              </a>
            )}
            {personal.linkedin && (
              <a href={personal.linkedin} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">in</span>LinkedIn <ArrowUpRight size={13} />
              </a>
            )}
          </div>
          <a className="back-top mono" href="#home" data-magnetic="3">
            <MagneticContent>
              BACK TO TOP <ArrowUpRight size={16} />
            </MagneticContent>
          </a>
        </footer>
      </div>
    </MotionConfig>
  );
}
