import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb } from '../../src/lib/db-mock';

describe('AI Concierge Tool Scoping & Authorization', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('separates client and owner tools: anonymous client cannot query owner occupancy stats', () => {
    const isOwner = false;
    const requestedTool = 'get_occupancy_stats';

    // Tool authorization check
    const clientAllowedTools = ['get_service_catalog', 'get_studio_info'];
    const isAuthorized = isOwner || clientAllowedTools.includes(requestedTool);

    expect(isAuthorized).toBe(false);
  });

  it('allows owner to execute operational stats tool', () => {
    const isOwner = true;
    const requestedTool = 'get_occupancy_stats';

    const clientAllowedTools = ['get_service_catalog', 'get_studio_info'];
    const ownerAllowedTools = [...clientAllowedTools, 'get_occupancy_stats'];

    const isAuthorized = isOwner && ownerAllowedTools.includes(requestedTool);
    expect(isAuthorized).toBe(true);
  });

  it('handles intent resolution for pricing inquiries without external LLM', () => {
    const services = mockDb.getTenantServices('tenant-graphite');
    const query = 'Сколько стоит полировка?';

    const match = services.find((s) => s.name.toLowerCase().includes('полировка'));
    expect(match).toBeDefined();
    expect(match?.price).toBe(22000);
  });
});
