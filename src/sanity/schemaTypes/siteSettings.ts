import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string' }),
    defineField({ name: 'contactPhone', title: 'Contact Phone', type: 'string' }),
    defineField({
      name: 'serviceArea',
      title: 'Service Area',
      type: 'string',
      description: 'Shown on the Contact page and used for local-SEO structured data. No street address is published — this is a service-area description, not a mailing address.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'platform', type: 'string' },
        { name: 'url', type: 'url' },
      ] }],
    }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
  ],
})
