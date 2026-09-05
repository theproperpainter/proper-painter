import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'quote', title: 'Quote', type: 'text', validation: (Rule) => Rule.required() }),
    defineField({ name: 'author', title: 'Author', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: { list: ["Angie's List", 'Google', 'Direct'] },
    }),
  ],
})
