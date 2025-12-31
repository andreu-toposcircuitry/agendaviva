import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveActivityFromAgent, resetSupabaseClient } from '../src/storage.js';
import type { AgentOutput } from '@agendaviva/shared';

// Mock environment variables
vi.stubEnv('SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-key');

// Mock Supabase client
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();
const mockIlike = vi.fn();
const mockLimit = vi.fn();
const mockEq = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('saveActivityFromAgent - Municipality Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock chain for duplicates check
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ ilike: mockIlike });
    mockIlike.mockReturnValue({ limit: mockLimit });
    mockLimit.mockResolvedValue({ data: [], error: null });
    
    // Setup mock for slug check - will be called twice
    mockFrom.mockImplementation((table: string) => {
      if (table === 'activitats') {
        return { 
          select: vi.fn().mockReturnValue({
            ilike: mockIlike.mockReturnValue({
              limit: mockLimit.mockResolvedValue({ data: [], error: null })
            })
          })
        };
      }
      return { select: mockSelect };
    });
  });

  afterEach(() => {
    resetSupabaseClient();
  });

  it('should accept and use a canonical municipality ID', async () => {
    const agentOutput: AgentOutput = {
      confianca: 85,
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Test Activity',
        descripcio: 'Test description',
        tipologies: [{ codi: 'arts', score: 90, justificacio: 'Test' }],
        quanEsFa: 'puntual',
        municipiId: 'granollers', // Valid canonical ID
        barriZona: null,
        espai: null,
        adreca: null,
        edatMin: null,
        edatMax: null,
        edatText: null,
        dies: null,
        horari: null,
        preu: null,
        email: null,
        telefon: null,
        web: null,
        tags: [],
      },
      nd: {
        score: 3,
        nivell: 'nd_compatible',
        justificacio: 'Test ND',
        indicadorsPositius: [],
        indicadorsNegatius: [],
        recomanacions: [],
        confianca: 80,
      },
      modelUsed: 'test-model',
    };

    // Mock successful insert
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ ilike: mockIlike });
    mockIlike.mockReturnValueOnce({ limit: mockLimit });
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    
    // Mock slug check
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));
    
    // Mock insert
    mockFrom.mockReturnValueOnce({ insert: mockInsert });
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ 
      data: { id: 'test-id' }, 
      error: null 
    });

    const result = await saveActivityFromAgent(agentOutput, 'http://test.com', 'Test text');

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    
    // Verify the insert was called with granollers (unchanged)
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.municipi_id).toBe('granollers');
  });

  it('should map municipality name to ID', async () => {
    const agentOutput: AgentOutput = {
      confianca: 85,
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Test Activity',
        descripcio: 'Test description',
        tipologies: [{ codi: 'arts', score: 90, justificacio: 'Test' }],
        quanEsFa: 'puntual',
        municipiId: 'Granollers', // Name instead of ID
        barriZona: null,
        espai: null,
        adreca: null,
        edatMin: null,
        edatMax: null,
        edatText: null,
        dies: null,
        horari: null,
        preu: null,
        email: null,
        telefon: null,
        web: null,
        tags: [],
      },
      nd: null,
      modelUsed: 'test-model',
    };

    // Mock successful insert (simplified)
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ ilike: mockIlike });
    mockIlike.mockReturnValueOnce({ limit: mockLimit });
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));
    
    mockFrom.mockReturnValueOnce({ insert: mockInsert });
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ 
      data: { id: 'test-id' }, 
      error: null 
    });

    const result = await saveActivityFromAgent(agentOutput, 'http://test.com', 'Test text');

    expect(result.success).toBe(true);
    
    // Verify the insert was called with the mapped ID
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.municipi_id).toBe('granollers'); // Should be mapped from 'Granollers'
  });

  it('should queue for review when municipality is not recognized', async () => {
    const agentOutput: AgentOutput = {
      confianca: 85,
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Test Activity',
        descripcio: 'Test description',
        tipologies: [{ codi: 'arts', score: 90, justificacio: 'Test' }],
        quanEsFa: 'puntual',
        municipiId: 'UnknownCity', // Invalid municipality
        barriZona: null,
        espai: null,
        adreca: null,
        edatMin: null,
        edatMax: null,
        edatText: null,
        dies: null,
        horari: null,
        preu: null,
        email: null,
        telefon: null,
        web: null,
        tags: [],
      },
      nd: null,
      modelUsed: 'test-model',
    };

    // Mock successful insert
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ ilike: mockIlike });
    mockIlike.mockReturnValueOnce({ limit: mockLimit });
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));
    
    mockFrom.mockReturnValueOnce({ insert: mockInsert });
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ 
      data: { id: 'test-id' }, 
      error: null 
    });
    
    // Mock review queue insert
    mockFrom.mockReturnValueOnce({ insert: mockInsert });
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ 
      data: { id: 'queue-id' }, 
      error: null 
    });

    const result = await saveActivityFromAgent(agentOutput, 'http://test.com', 'Test text');

    expect(result.success).toBe(true);
    expect(result.cuaId).toBeDefined(); // Should be queued for review
    
    // Verify municipi_id is null when not recognized
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.municipi_id).toBeNull();
    expect(insertCall.estat).toBe('pendent'); // Should be pending review
  });
});

describe('saveActivityFromAgent - Tipologia Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();
  });

  it('should use fallback tipologia when tipologies array is empty', async () => {
    const agentOutput: AgentOutput = {
      confianca: 85,
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Test Activity',
        descripcio: 'Test description',
        tipologies: [], // Empty array
        quanEsFa: 'puntual',
        municipiId: 'granollers',
        barriZona: null,
        espai: null,
        adreca: null,
        edatMin: null,
        edatMax: null,
        edatText: null,
        dies: null,
        horari: null,
        preu: null,
        email: null,
        telefon: null,
        web: null,
        tags: [],
      },
      nd: null,
      modelUsed: 'test-model',
    };

    // Mock successful insert
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ ilike: mockIlike });
    mockIlike.mockReturnValueOnce({ limit: mockLimit });
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));
    
    mockFrom.mockReturnValueOnce({ insert: mockInsert });
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ 
      data: { id: 'test-id' }, 
      error: null 
    });
    
    // Mock review queue insert
    mockFrom.mockReturnValueOnce({ insert: mockInsert });
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ 
      data: { id: 'queue-id' }, 
      error: null 
    });

    const result = await saveActivityFromAgent(agentOutput, 'http://test.com', 'Test text');

    expect(result.success).toBe(true);
    
    // Verify tipologia_principal fallback
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.tipologia_principal).toBe('lleure'); // Should use fallback
    expect(insertCall.estat).toBe('pendent'); // Should be queued for review
  });

  it('should use first tipologia when array is not empty', async () => {
    const agentOutput: AgentOutput = {
      confianca: 85,
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Test Activity',
        descripcio: 'Test description',
        tipologies: [
          { codi: 'esports', score: 95, justificacio: 'Sports activity' },
          { codi: 'arts', score: 80, justificacio: 'Also has arts component' }
        ],
        quanEsFa: 'puntual',
        municipiId: 'granollers',
        barriZona: null,
        espai: null,
        adreca: null,
        edatMin: null,
        edatMax: null,
        edatText: null,
        dies: null,
        horari: null,
        preu: null,
        email: null,
        telefon: null,
        web: null,
        tags: [],
      },
      nd: null,
      modelUsed: 'test-model',
    };

    // Mock successful insert
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ ilike: mockIlike });
    mockIlike.mockReturnValueOnce({ limit: mockLimit });
    mockLimit.mockResolvedValueOnce({ data: [], error: null });
    
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));
    
    mockFrom.mockReturnValueOnce({ insert: mockInsert });
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ 
      data: { id: 'test-id' }, 
      error: null 
    });

    const result = await saveActivityFromAgent(agentOutput, 'http://test.com', 'Test text');

    expect(result.success).toBe(true);
    
    // Verify tipologia_principal uses first from array
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.tipologia_principal).toBe('esports'); // Should use first tipologia
  });
});
