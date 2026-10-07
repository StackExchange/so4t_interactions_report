import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../so4t_interactions.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'standalone HTML contains inline JavaScript');
const core = script.slice(0, script.indexOf('$("rename-file").addEventListener'));

function app(fetch) {
  const context = vm.createContext({
    URL, AbortController, DOMException, setTimeout, clearTimeout, fetch,
    document: { getElementById() { throw new Error('DOM should not be needed by these tests'); } }
  });
  vm.runInContext(`${core}\nglobalThis.app = { apiBase, parseCsv, makeAggregator, ApiV3, collect, matrixCsv };`, context);
  return context.app;
}

test('site URLs resolve to API v3 and reject invalid paths', () => {
  const { apiBase } = app(() => {});
  assert.equal(apiBase('https://example.stackenterprise.co/'), 'https://example.stackenterprise.co/api/v3');
  assert.equal(apiBase('https://stackoverflowteams.com/c/my-team/'), 'https://api.stackoverflowteams.com/v3/teams/my-team');
  assert.throws(() => apiBase('https://example.stackenterprise.co/api/2.3'), /Enterprise URLs/);
  assert.throws(() => apiBase('http://example.stackenterprise.co'), /HTTPS/);
});

test('CSV renames handle quoted commas and department number trimming', () => {
  const { parseCsv, makeAggregator } = app(() => {});
  const names = parseCsv('old_team_name,new_team_name\r\n"Sales, East","Sales"\r\n');
  const result = makeAggregator([{ id: 2, department: 'Sales, East' }, { id: 3, department: 'Eng2.1' }], names, true);
  result.question({ owner: { id: 2 } }, [{ owner: { id: 3 } }], [], []);
  assert.equal(result.pairs.get(JSON.stringify(['Eng', 'Sales'])), 1);
});

test('bundled rename template is directly importable', () => {
  const { parseCsv } = app(() => {});
  const template = readFileSync(new URL('../Templates/team_rename.csv', import.meta.url), 'utf8');
  const names = parseCsv(template);
  assert.equal(names.get('SRE'), 'Site Reliability Engineering');
  assert.equal(names.get('PM63'), 'Product Management');
});

test('v3 pagination and separate answer/comment endpoints produce a symmetric matrix', async () => {
  const calls = [];
  const payloads = new Map([
    ['/users?page=1&pageSize=100', { items: [{ id: 2, department: 'Eng' }, { id: 3, department: 'Sales' }, { id: 4, department: 'Product' }], totalPages: 1 }],
    ['/questions?sort=creation&order=asc&page=1&pageSize=100', { items: [{ id: 10, owner: { id: 2 }, answerCount: 2, commentCount: 1 }], totalPages: 1 }],
    ['/questions/10/answers?page=1&pageSize=100', { items: [{ id: 11, owner: { id: 3 }, commentCount: 2 }, { id: 12, owner: { id: 3 }, commentCount: 0 }], totalPages: 1 }],
    ['/questions/10/comments', [{ ownerUserId: 4 }]],
    ['/questions/10/answers/11/comments', [{ ownerUserId: 2 }, { ownerUserId: 4 }]]
  ]);
  const fetch = async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname.startsWith('/api/v3'), true);
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(options.credentials, 'omit');
    const path = parsed.pathname.replace('/api/v3', '') + parsed.search;
    calls.push(path);
    assert.ok(payloads.has(path), `unexpected API request ${path}`);
    return new Response(JSON.stringify(payloads.get(path)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const { ApiV3, collect, matrixCsv } = app(fetch);
  const client = new ApiV3('https://example.stackenterprise.co/api/v3', 'test-token', new AbortController().signal);
  const report = await collect(client, new Map(), false, '', '', () => {});
  assert.equal(report.stats.questions, 1);
  assert.equal(report.stats.answers, 2);
  assert.equal(report.stats.comments, 3);
  assert.equal(report.pairs.get(JSON.stringify(['Eng', 'Sales'])), 1, 'two sales answers on one question count once');
  assert.equal(report.pairs.get(JSON.stringify(['Eng', 'Product'])), 1);
  assert.equal(report.pairs.get(JSON.stringify(['Product', 'Sales'])), 1, 'answer comment creates an answer discussion connection');
  assert.equal(calls.length, 5);
  const csv = matrixCsv(report);
  assert.match(csv, /"Eng","0","1","1"/);
  assert.match(csv, /"Sales","1","1","0"/);
});
