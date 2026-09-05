import { reviews } from './reviews-data'

describe('reviews data', () => {
  it('has exactly 27 reviews', () => {
    expect(reviews).toHaveLength(27)
  })

  it('has exactly 23 HomeAdvisor-sourced reviews and 4 Direct-sourced reviews', () => {
    const homeAdvisor = reviews.filter((r) => r.source === 'HomeAdvisor')
    const direct = reviews.filter((r) => r.source === 'Direct')
    expect(homeAdvisor).toHaveLength(23)
    expect(direct).toHaveLength(4)
  })

  it('every review has a non-empty quote and author', () => {
    for (const review of reviews) {
      expect(review.quote.length).toBeGreaterThan(0)
      expect(review.author.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate quotes', () => {
    const quotes = reviews.map((r) => r.quote)
    expect(new Set(quotes).size).toBe(quotes.length)
  })
})
