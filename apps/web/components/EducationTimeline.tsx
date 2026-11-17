'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Portfolio } from '@portfolio/content';
import { courseworkGroups } from '@portfolio/content/categories';

function EducationEntry({ entry }: { entry: Portfolio['education'][number] }) {
  const coursework = entry.coursework;
  const hasCoursework = courseworkGroups.some(({ key }) => coursework[key].length > 0);

  return (
    <article className="education-entry" data-reveal="enter">
      <span className="mono timeline-period">{entry.period || 'Dates to be added'}</span>
      <details className="education-details">
        <summary aria-label={`${entry.title} coursework`}>
          <div>
            <h3>{entry.title}</h3>
            <span className={entry.organization ? 'organization' : 'placeholder-inline'}>
              {entry.organization || 'Institution / organization to be added'}
            </span>
            <p>{entry.description}</p>
            <span className="coursework-cue" aria-hidden="true">
              <span className="coursework-view">View coursework</span>
              <span className="coursework-hide">Hide coursework</span>
            </span>
          </div>
          <ChevronDown className="education-chevron" size={18} aria-hidden="true" />
        </summary>
        <div className="coursework-panel">
          {(coursework.note || !hasCoursework) && (
            <p className="coursework-note">
              {coursework.note || 'Coursework details will be added once confirmed.'}
            </p>
          )}
          <div className="coursework-groups">
            {courseworkGroups.map(({ key, label }) => (
              <section
                className={`coursework-group coursework-${key}`}
                key={key}
                aria-label={label}
              >
                <h4>{label}</h4>
                {coursework[key].length ? (
                  <ul>
                    {coursework[key].map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="coursework-pending">Details to be added.</p>
                )}
              </section>
            ))}
          </div>
        </div>
      </details>
    </article>
  );
}

export default function EducationTimeline({ items }: { items: Portfolio['education'] }) {
  if (!items.length)
    return (
      <div className="empty-timeline">
        <span className="mono">[ DETAILS TO BE ADDED ]</span>
        <p>Education details will be added here.</p>
      </div>
    );
  return (
    <div className="timeline education-timeline">
      {items.map((entry) => (
        <EducationEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
