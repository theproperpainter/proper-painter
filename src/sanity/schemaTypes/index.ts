import type { SchemaTypeDefinition } from 'sanity'
import { service } from './service'
import { portfolioProject } from './portfolioProject'
import { testimonial } from './testimonial'
import { teamMember } from './teamMember'
import { siteSettings } from './siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  service,
  portfolioProject,
  testimonial,
  teamMember,
  siteSettings,
]
