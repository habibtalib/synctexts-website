import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

// Blog collection - Markdown posts with glob loader
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Team collection - YAML data with file loader
const team = defineCollection({
  loader: file('./src/data/team.yaml'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    photo: z.string(),
    order: z.number().default(0),
  }),
});

// Testimonials collection - YAML data with file loader
const testimonials = defineCollection({
  loader: file('./src/data/testimonials.yaml'),
  schema: z.object({
    id: z.string(),
    quote: z.string(),
    name: z.string(),
    role: z.string(),
    company: z.string(),
  }),
});

// Pricing collection - YAML data with file loader
const pricing = defineCollection({
  loader: file('./src/data/pricing.yaml'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.string(),
    features: z.array(z.string()),
    highlighted: z.boolean().default(false),
    cta: z.string().default('Get Started'),
  }),
});

// Portfolio collection - Custom inline loader that reads local YAML config
// and optionally fetches GitHub repo data at build time
const portfolio = defineCollection({
  loader: {
    name: 'portfolio-loader',
    async load({ store, logger }) {
      // Read local config
      let config: Array<Record<string, unknown>>;
      try {
        const raw = readFileSync('./src/data/portfolio-config.yaml', 'utf-8');
        config = parseYaml(raw) as Array<Record<string, unknown>>;
      } catch (err) {
        logger.error('Failed to read portfolio-config.yaml');
        return;
      }

      const pat = process.env.GITHUB_PAT;
      if (!pat) {
        logger.warn(
          'GITHUB_PAT not set -- using local config data only. Set GITHUB_PAT to fetch live GitHub repo data.'
        );
      }

      for (const project of config) {
        const repo = project.repo as string | undefined;
        let ghData: Record<string, unknown> = {};

        // Fetch GitHub data if PAT is available and repo is specified
        if (pat && repo) {
          try {
            const res = await fetch(`https://api.github.com/repos/${repo}`, {
              headers: {
                Authorization: `Bearer ${pat}`,
                Accept: 'application/vnd.github+json',
              },
            });

            if (res.ok) {
              const json = await res.json();
              ghData = {
                title: json.name,
                description: json.description,
                updatedAt: json.updated_at,
                languages: json.language ? [json.language] : [],
              };

              // Fetch full languages list
              const langRes = await fetch(
                `https://api.github.com/repos/${repo}/languages`,
                {
                  headers: {
                    Authorization: `Bearer ${pat}`,
                    Accept: 'application/vnd.github+json',
                  },
                }
              );
              if (langRes.ok) {
                const langData = await langRes.json();
                ghData.languages = Object.keys(langData);
              }
            } else {
              logger.warn(`GitHub API returned ${res.status} for ${repo}`);
            }
          } catch (err) {
            logger.warn(`Failed to fetch GitHub data for ${repo}: ${err}`);
          }
        }

        // Merge: local overrides take priority over GitHub data
        const slug = project.slug as string;
        const entry = {
          title:
            (project.title as string) ||
            (ghData.title as string) ||
            slug,
          description:
            (project.description as string) ||
            (ghData.description as string) ||
            '',
          languages:
            (project.techTags as string[]) ||
            (ghData.languages as string[]) ||
            [],
          updatedAt: (ghData.updatedAt as string) || null,
          screenshots: (project.screenshots as string[]) || [],
          caseStudySlug: (project.caseStudySlug as string) || null,
        };

        store.set({
          id: slug,
          data: entry,
        });
      }
    },
  },
  schema: z.object({
    title: z.string(),
    description: z.string(),
    languages: z.array(z.string()),
    updatedAt: z.string().nullable(),
    screenshots: z.array(z.string()).default([]),
    caseStudySlug: z.string().nullable(),
  }),
});

export const collections = { blog, team, testimonials, pricing, portfolio };
