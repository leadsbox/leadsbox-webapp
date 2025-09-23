import { z } from 'zod';

export const automationNodeTypeSchema = z.union([
  z.literal('trigger'),
  z.literal('condition'),
  z.literal('action'),
]);

export type AutomationNodeType = z.infer<typeof automationNodeTypeSchema>;

export const triggerKindSchema = z.union([
  z.literal('message.received'),
  z.literal('no_reply.for_hours'),
  z.literal('invoice.paid'),
]);

export type TriggerKind = z.infer<typeof triggerKindSchema>;

export const conditionFieldSchema = z.union([
  z.literal('channel'),
  z.literal('label'),
  z.literal('text'),
  z.literal('assignee'),
]);

export type ConditionField = z.infer<typeof conditionFieldSchema>;

export const conditionOpSchema = z.union([
  z.literal('eq'),
  z.literal('in'),
  z.literal('contains'),
  z.literal('not_contains'),
]);

export type ConditionOp = z.infer<typeof conditionOpSchema>;

export const actionKindSchema = z.union([
  z.literal('send_template'),
  z.literal('add_label'),
  z.literal('create_followup'),
  z.literal('assign'),
  z.literal('move_stage'),
  z.literal('create_invoice'),
]);

export type ActionKind = z.infer<typeof actionKindSchema>;

export const canvasNodeBaseSchema = z.object({
  id: z.string(),
  type: automationNodeTypeSchema,
  x: z.number(),
  y: z.number(),
  meta: z.record(z.any()).optional(),
});

export type CanvasNodeBase = z.infer<typeof canvasNodeBaseSchema>;

export const triggerNodeSchema = canvasNodeBaseSchema.extend({
  type: z.literal('trigger'),
  trigger: z.object({
    kind: triggerKindSchema,
    waitHours: z.number().optional(),
  }),
});

export type TriggerNode = z.infer<typeof triggerNodeSchema>;

export const conditionRuleSchema = z.object({
  field: conditionFieldSchema,
  op: conditionOpSchema,
  value: z.any(),
});

export const conditionNodeSchema = canvasNodeBaseSchema.extend({
  type: z.literal('condition'),
  conditions: z.array(conditionRuleSchema),
  mode: z.union([z.literal('AND'), z.literal('OR')]).default('AND'),
});

export type ConditionNode = z.infer<typeof conditionNodeSchema>;

export const actionNodeSchema = canvasNodeBaseSchema.extend({
  type: z.literal('action'),
  action: z.object({
    kind: actionKindSchema,
    args: z.record(z.any()).optional(),
  }),
});

export type ActionNode = z.infer<typeof actionNodeSchema>;

export const canvasEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
});

export type CanvasEdge = z.infer<typeof canvasEdgeSchema>;

export const automationFlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.union([
    z.literal('DRAFT'),
    z.literal('ON'),
    z.literal('OFF'),
  ]),
  nodes: z.array(z.union([triggerNodeSchema, conditionNodeSchema, actionNodeSchema])),
  edges: z.array(canvasEdgeSchema),
  version: z.number().int(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AutomationFlow = z.infer<typeof automationFlowSchema>;

export type CanvasNode = TriggerNode | ConditionNode | ActionNode;

export type NodeSelection = {
  nodeId: string | null;
  port?: 'input' | 'output';
};

export const DEFAULT_CANVAS_SIZE = {
  width: 2400,
  height: 1400,
};
