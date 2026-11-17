import { z } from 'zod';
import { resumeSchema } from './resume';
export * from './resume';
import { gameCategories, emptyCoursework } from './categories';
export { gameCategories, courseworkGroups, emptyCoursework } from './categories';

const text = z.string().trim().max(6000);
const short = z.string().trim().min(1).max(180);
const id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);
export const externalUrl = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const parsed = new URL(value);
  return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
}, 'Use an HTTPS URL without embedded credentials');
export const assetPath = z
  .string()
  .regex(
    /^\/assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:jpe?g|png|webp|pdf)$/i,
    'Use a file inside /assets/',
  );
const optionalLink = z.union([externalUrl, z.literal('')]);
const optionalAsset = z.union([assetPath, z.literal('')]);
const tags = z.array(short).max(16);
const project = z.object({
  id,
  title: short,
  category: short,
  description: text.min(1),
  technologies: tags,
  problem: text,
  approach: text,
  learning: z.array(text).max(12),
  repository: optionalLink,
  demo: optionalLink,
  image: optionalAsset,
});
const game = z.object({
  id,
  name: short,
  description: text.min(1),
  featured: z.boolean().default(false),
  category: z.enum(gameCategories),
  tags,
  destination: z.union([
    externalUrl,
    z.string().regex(/^\/[a-z0-9-]+\/$/, 'Use an existing root game path'),
  ]),
});
const timeline = z.object({
  id,
  title: short,
  organization: text.max(200),
  period: text.max(120),
  description: text,
});
export const courseworkSchema = z.object({
  subjects: z.array(short).max(50).default([]),
  programmingLanguages: z.array(short).max(30).default([]),
  technologies: z.array(short).max(50).default([]),
  concepts: z.array(short).max(50).default([]),
  note: text.default(''),
});
const education = timeline.extend({
  coursework: courseworkSchema.default(emptyCoursework),
});
const skill = z.object({ id, name: short, category: short });
const achievement = z.object({ id, title: short, description: text });
export const portfolioSchema = z
  .object({
    schemaVersion: z.literal(1),
    personal: z.object({
      name: short,
      role: short,
      introduction: text.min(1),
      about: text,
      portrait: optionalAsset,
      portraitAlt: short,
      email: z.union([z.email(), z.literal('')]),
      github: optionalLink,
      linkedin: optionalLink,
    }),
    projects: z.array(project).max(100),
    games: z.array(game).max(200),
    skills: z.array(skill).max(150),
    education: z.array(education).max(30),
    achievements: z.array(achievement).max(100),
    experience: z.array(timeline).max(50),
    resume: resumeSchema,
  })
  .superRefine((data, context) => {
    for (const key of [
      'projects',
      'games',
      'skills',
      'education',
      'achievements',
      'experience',
    ] as const) {
      const seen = new Set<string>();
      data[key].forEach((item, index) => {
        if (seen.has(item.id))
          context.addIssue({
            code: 'custom',
            path: [key, index, 'id'],
            message: 'IDs must be unique',
          });
        seen.add(item.id);
      });
    }
    const images = [data.personal.portrait, ...data.projects.map((p) => p.image)];
    images.forEach((value) => {
      if (value && !/\.(jpe?g|png|webp)$/i.test(value))
        context.addIssue({ code: 'custom', message: 'Images must be JPEG, PNG, or WebP' });
    });
    if (data.resume.file && !/\.pdf$/i.test(data.resume.file))
      context.addIssue({
        code: 'custom',
        path: ['resume', 'file'],
        message: 'Resume must be a PDF',
      });
  });
export type Portfolio = z.infer<typeof portfolioSchema>;
export type Collection =
  | 'projects'
  | 'games'
  | 'skills'
  | 'education'
  | 'achievements'
  | 'experience';
export function referencedAssets(content: Portfolio): string[] {
  return [
    ...new Set(
      [
        content.personal.portrait,
        content.resume.file,
        ...content.projects.map((p) => p.image),
      ].filter(Boolean),
    ),
  ];
}
