import type { MetadataRoute } from 'next';
import { getAllProjects, getProjectChapters } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://godot-learning.space-z.ai';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/playground`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic project pages
  const projectPages: MetadataRoute.Sitemap = [];
  try {
    const projects = getAllProjects();

    for (const project of projects) {
      // Project overview page
      projectPages.push({
        url: `${baseUrl}/learn/${project.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });

      // Chapter pages
      try {
        const chapters = getProjectChapters(project.slug);
        for (const chapter of chapters) {
          projectPages.push({
            url: `${baseUrl}/learn/${project.slug}/${chapter.slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }
      } catch {
        // Skip chapters if content can't be loaded
      }
    }
  } catch {
    // Skip projects if content can't be loaded
  }

  return [...staticPages, ...projectPages];
}
