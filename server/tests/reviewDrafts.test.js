import { composeDrafts, createReviewDrafts, isUsableDraft, REVIEW_TOPICS } from '../services/reviewDrafts.js';

const POSITIVE = /Excellent|Highly recommended|Really happy|Very pleased|definitely order again/i;

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe('built-in draft writer', () => {
  it('writes four different, safe drafts that stick to the chosen topics', () => {
    const drafts = composeDrafts({ rating: 5, topics: ['prices', 'support'] });
    expect(drafts).toHaveLength(4);
    expect(new Set(drafts.map((d) => d.body)).size).toBe(4);
    drafts.forEach((d) => expect(isUsableDraft(d)).toBe(true));
    const text = drafts.map((d) => d.body).join(' ');
    expect(text).toMatch(/price|value/i);
    expect(text).not.toMatch(/deliver|packag|website/i);
  });

  it('matches the tone to the rating', () => {
    const low = composeDrafts({ rating: 1, topics: ['delivery', 'support'] });
    low.forEach((d) => expect(`${d.title} ${d.body}`).not.toMatch(POSITIVE));
    expect(low.map((d) => d.title)).toEqual(expect.arrayContaining(['Disappointed']));

    const mixed = composeDrafts({ rating: 3, topics: ['quote'] });
    mixed.forEach((d) => expect(`${d.title} ${d.body}`).not.toMatch(POSITIVE));
  });

  it('names the product by its short name', () => {
    const drafts = composeDrafts({ rating: 4, topics: ['quality'], productName: 'Introcin 250 (Azithromycin Tablets IP 250 mg)' }, () => 0);
    const text = drafts.map((d) => d.body).join(' ');
    expect(text).toContain('Introcin 250');
    expect(text).not.toContain('Azithromycin');
  });

  it('covers every topic in every tone', () => {
    for (const topic of Object.keys(REVIEW_TOPICS)) {
      for (const rating of [1, 2, 3, 4, 5]) {
        expect(composeDrafts({ rating, topics: [topic] }).length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('AI drafts', () => {
  const fakeClient = (reply) => {
    const calls = [];
    return {
      calls,
      beta: {
        messages: {
          create: async (params) => {
            calls.push(params);
            if (reply instanceof Error) throw reply;
            return reply;
          },
        },
      },
    };
  };
  const answer = (drafts, stop_reason = 'end_turn') => ({
    stop_reason,
    content: [{ type: 'text', text: JSON.stringify({ drafts }) }],
  });

  it('asks Claude for structured drafts and keeps only safe ones', async () => {
    const client = fakeClient(
      answer([
        { title: 'Great service', body: 'Quick quote and friendly support. Would recommend.' },
        { title: 'Call me', body: 'Great prices, call me on +1 415 555 0134 for more.' },
        { title: 'Very happy', body: 'Fair prices and helpful replies to my questions.' },
        { title: 'Smooth', body: 'Everything was easy from quote to delivery.' },
        { title: 'Extra', body: 'A fifth draft that should be cut off.' },
      ])
    );
    const result = await createReviewDrafts({ rating: 5, topics: ['prices', 'support'], productName: '', notes: 'quick replies' }, { client });

    expect(result.source).toBe('ai');
    expect(result.drafts.map((d) => d.title)).toEqual(['Great service', 'Very happy', 'Smooth', 'Extra']);
    const [params] = client.calls;
    expect(params).toMatchObject({
      model: 'claude-opus-5-5',
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema' } },
    });
    expect(params.messages[0].content).toContain('Star rating: 5 out of 5');
    expect(params.messages[0].content).toContain('Prices, Customer support');
    expect(params.messages[0].content).toContain('<notes>quick replies</notes>');
  });

  it.each([
    ['a refusal', answer([], 'refusal')],
    ['a cut-off answer', answer([], 'max_tokens')],
    ['broken JSON', { stop_reason: 'end_turn', content: [{ type: 'text', text: '{not json' }] }],
    ['too few usable drafts', answer([{ title: 'x', body: 'visit www.spam.com now' }])],
    ['a network error', new Error('socket hang up')],
  ])('falls back to the built-in writer on %s', async (_label, reply) => {
    const result = await createReviewDrafts({ rating: 4, topics: ['delivery'] }, { client: fakeClient(reply) });
    expect(result.source).toBe('builtin');
    expect(result.drafts.length).toBeGreaterThanOrEqual(3);
  });

  it('uses the built-in writer when no API key is configured', async () => {
    const result = await createReviewDrafts({ rating: 5, topics: ['quote'] });
    expect(result.source).toBe('builtin');
  });
});
