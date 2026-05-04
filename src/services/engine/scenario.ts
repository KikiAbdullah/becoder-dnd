import { z } from 'zod';
import { Scenario, GameNode } from '../../types/game';

const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  icon: z.string().optional()
});

const NodeSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['narrative', 'voting', 'dice_check', 'effect']),
  text: z.string(),
  image: z.string().optional(),
  auto_advance: z.number().optional(),
  next: z.string().optional(),
  options: z.array(OptionSchema).optional(),
  timeout: z.number().optional(),
  on_timeout: z.string().optional(),
  on_success: z.string().optional(),
  on_fail: z.string().optional(),
  difficulty: z.number().optional(),
  required_ability: z.enum([
    'strength', 'dexterity', 'constitution',
    'intelligence', 'wisdom', 'charisma'
  ]).optional()
});

const ScenarioSchema = z.object({
  scenario_id: z.string(),
  nodes: z.record(z.string(), NodeSchema),
  start_node: z.string()
});

export async function loadScenario(path: string): Promise<Scenario> {
  const response = await fetch(path);
  
  if (!response.ok) {
    throw new Error(`Failed to load scenario: ${path}`);
  }
  
  const raw = await response.json();
  const parsed = ScenarioSchema.safeParse(raw);
  
  if (!parsed.success) {
    console.error('Scenario validation error:', parsed.error.format());
    throw new Error('Scenario file is invalid or corrupted');
  }
  
  const scenario = parsed.data as Scenario;
  
  // Inject id ke tiap node dari key-nya
  Object.entries(scenario.nodes).forEach(([key, node]) => {
    (node as GameNode).id = key;
  });
  
  validateScenarioReachability(scenario);
  
  return scenario;
}

function validateScenarioReachability(scenario: Scenario): void {
  const nodeIds = new Set(Object.keys(scenario.nodes));
  
  if (!nodeIds.has(scenario.start_node)) {
    throw new Error(`Start node "${scenario.start_node}" does not exist`);
  }
  
  Object.entries(scenario.nodes).forEach(([id, node]) => {
    if (node.next && !nodeIds.has(node.next)) {
      throw new Error(`Node "${id}" references non-existent node "${node.next}"`);
    }
    if (node.on_success && !nodeIds.has(node.on_success)) {
      throw new Error(`Node "${id}" on_success references non-existent node "${node.on_success}"`);
    }
    if (node.on_fail && !nodeIds.has(node.on_fail)) {
      throw new Error(`Node "${id}" on_fail references non-existent node "${node.on_fail}"`);
    }
  });
}

export function getNode(scenario: Scenario, nodeId: string): GameNode | null {
  return scenario.nodes[nodeId] || null;
}
