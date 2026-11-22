import { jest } from '@jest/globals';
import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestMedicine } from './helpers.js';

// The Claude-powered path, with the SDK mocked (no network, no cost). Checks
// that tool calls reach the real catalogue, that show_in_chat becomes cards,
// forms and chips, and that any failure falls back to the rule-based assistant.

const create = jest.fn();

jest.unstable_mockModule('@anthropic-ai/sdk', () => {
  class Anthropic {
    constructor() {
      this.beta = { messages: { create } };
      this.messages = { create };
    }
  }
  Anthropic.APIError = class APIError extends Error {};
  return { default: Anthropic };
});

let app;

beforeAll(async () => {
  await startTestDb();
  process.env.ANTHROPIC_API_KEY = 'test-key';
  ({ default: app } = await import('../app.js'));
});

afterAll(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  await stopTestDb();
});

beforeEach(() => {
  create.mockReset();
});

afterEach(async () => {
  await clearCollections();
});

async function openSession(productContext) {
  const res = await request(app).post('/api/chat/session').send({ productContext });
  return res.body.sessionToken;
}

const say = async (sessionToken, text) =>
  (await request(app).post('/api/chat/message').send({ sessionToken, text })).body.messages[1];

const toolUse = (id, name, input) => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id, name, input }] });
const finalText = (text) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: {} });

const lastToolResult = (call) => {
  const { messages } = create.mock.calls[call][0];
  return JSON.parse(messages[messages.length - 1].content[0].content);
};

describe('AI assistant', () => {
  it('searches the catalogue with tools and shows the cards and form it chose', async () => {
    await createTestMedicine({
      slug: 'cenforce-100',
      name: 'Cenforce 100 (Sildenafil Citrate Tablets IP 100 mg)',
      composition: 'Sildenafil 100 mg per tablet.',
      variants: [{ strength: '100 mg', form: 'Tablet', packSize: '10 x 10 Tablets', packagingType: 'Box', price: 28, stock: 10 }],
    });
    create
      .mockResolvedValueOnce(toolUse('t1', 'search_catalogue', { query: 'cenfroce' }))
      .mockResolvedValueOnce(
        toolUse('t2', 'show_in_chat', {
          product_slugs: ['cenforce-100', 'made-up-slug'],
          open_form: 'quote',
          quote_product_slug: 'cenforce-100',
          quote_quantity: 50,
          suggested_replies: ['Do you ship to Canada?'],
        })
      )
      .mockResolvedValueOnce(finalText('Haan ji, **Cenforce 100** available hai, listed at $28.00 per box. Neeche form bhar dijiye.'));

    const token = await openSession();
    const reply = await say(token, 'cenfroce chahiye 50 box');

    // The tool really searched the catalogue, typo and all.
    expect(lastToolResult(1).results[0]).toMatchObject({ slug: 'cenforce-100', listedPriceUsd: 28, spellingCorrected: true });
    // Markdown is stripped; unknown slugs are dropped; the quote form opens.
    expect(reply.text).toBe('Haan ji, Cenforce 100 available hai, listed at $28.00 per box. Neeche form bhar dijiye.');
    expect(reply.cards.map((card) => card.slug)).toEqual(['cenforce-100']);
    expect(reply.form).toMatchObject({ id: 'inquiry', quantity: 50, medicine: { slug: 'cenforce-100' } });

    const request0 = create.mock.calls[0][0];
    expect(request0.model).toBe('claude-opus-5-5');
    expect(request0.system[0].text).toContain('cenforce-100 | Cenforce 100');
    expect(request0.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(request0.messages[request0.messages.length - 1]).toEqual({ role: 'user', content: 'cenfroce chahiye 50 box' });
  });

  it('sends the recent conversation and turns suggested replies into chips', async () => {
    create.mockResolvedValueOnce(finalText('Hi! How can I help you today?'));
    const token = await openSession();
    await say(token, 'hello there');

    create
      .mockResolvedValueOnce(toolUse('t1', 'show_in_chat', { product_slugs: [], open_form: 'none', quote_product_slug: '', suggested_replies: ['How do I order?', 'Talk to the team'] }))
      .mockResolvedValueOnce(finalText('We supply buyers in Canada, yes.'));
    const reply = await say(token, 'do you deliver in canada');

    expect(reply.quickActions).toEqual([
      { id: 'say:How do I order?', label: 'How do I order?' },
      { id: 'say:Talk to the team', label: 'Talk to the team' },
    ]);
    const { messages } = create.mock.calls[1][0];
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(messages[0].content).toBe('hello there');
  });

  it('falls back to the rule-based assistant when the API fails', async () => {
    create.mockRejectedValue(Object.assign(new Error('overloaded'), { status: 529 }));
    const token = await openSession();
    const reply = await say(token, 'how do I order?');
    expect(reply.text).toMatch(/quotes rather than instant checkout/);
  });

  it('falls back when the model refuses', async () => {
    create.mockResolvedValueOnce({ stop_reason: 'refusal', content: [] });
    const token = await openSession();
    const reply = await say(token, 'do you ship to canada?');
    expect(reply.text).toMatch(/regularly supply buyers in Canada/);
  });

  it('never sends medical-advice questions to the model', async () => {
    const token = await openSession();
    const reply = await say(token, 'I have a headache, which tablet should I take?');
    expect(create).not.toHaveBeenCalled();
    expect(reply.text).toMatch(/doctor or pharmacist/i);
  });

  it('handles "new chat" itself without calling the model', async () => {
    const token = await openSession();
    const reply = await say(token, 'new chat');
    expect(create).not.toHaveBeenCalled();
    expect(reply.text).toMatch(/fresh|start|begin/i);
  });
});
