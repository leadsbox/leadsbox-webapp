import { automationFlowSchema, AutomationFlow } from './types';

export const toJson = (flow: AutomationFlow): string => JSON.stringify(flow, null, 2);

export const fromJson = (json: string): AutomationFlow => {
  const parsed = automationFlowSchema.parse(JSON.parse(json));
  return parsed;
};

export const validateFlow = (flow: AutomationFlow): { ok: boolean; issues: string[] } => {
  const issues: string[] = [];

  const triggers = flow.nodes.filter((node) => node.type === 'trigger');
  if (triggers.length === 0) {
    issues.push('At least one trigger is required.');
  }
  if (triggers.length > 1) {
    issues.push('Only one trigger is allowed per automation.');
  }

  const actions = flow.nodes.filter((node) => node.type === 'action');
  if (actions.length === 0) {
    issues.push('Add at least one action to complete the automation.');
  }

  const connectedNodeIds = new Set<string>();
  flow.edges.forEach((edge) => {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  });

  flow.nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id)) {
      issues.push(`Node “${node.type}” (${node.id}) is not connected.`);
    }
  });

  flow.nodes.forEach((node) => {
    if (node.type === 'trigger') {
      if (node.trigger.kind === 'no_reply.for_hours' && !node.trigger.waitHours) {
        issues.push('“No reply” trigger requires a wait time.');
      }
    }

    if (node.type === 'condition') {
      if (node.conditions.length === 0) {
        issues.push('Conditions must have at least one rule.');
      }
    }

    if (node.type === 'action') {
      if (node.action.kind === 'send_template' && !node.action.args?.templateId) {
        issues.push('Select a template to send.');
      }
      if (node.action.kind === 'create_followup' && !node.action.args?.offsetHours) {
        issues.push('Follow-up actions require a reminder offset.');
      }
    }
  });

  const hasUnreachableAction = actions.some((node) =>
    !flow.edges.some((edge) => edge.to === node.id)
  );
  if (hasUnreachableAction) {
    issues.push('Ensure every action is reachable from the trigger.');
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};
