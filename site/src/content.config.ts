import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { kbLoader } from './kb-loader.mjs';

export const collections = {
  docs: defineCollection({ loader: kbLoader({ base: '..' }), schema: docsSchema() }),
};
