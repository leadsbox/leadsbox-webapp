import { useCallback, useEffect, useRef, useState } from 'react';
import { AutomationFlow, CanvasNode, CanvasEdge, automationFlowSchema } from './types';

const NODE_GAP_X = 240;
const NODE_GAP_Y = 180;

export const generateId = (prefix = 'node') => `${prefix}_${crypto.randomUUID()}`;

export const snapToGrid = (value: number, size = 16) => Math.round(value / size) * size;

export const layoutNodes = (nodes: CanvasNode[]): CanvasNode[] =>
  nodes.map((node, idx) => ({
    ...node,
    x: snapToGrid(node.x ?? 0, 16) || 160 + idx * NODE_GAP_X,
    y: snapToGrid(node.y ?? 0, 16) || 160 + idx * NODE_GAP_Y,
  }));

export const removeDanglingEdges = (edges: CanvasEdge[], nodes: CanvasNode[]) => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return edges.filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));
};

export const ensureSingleTrigger = (nodes: CanvasNode[]): CanvasNode[] => {
  const triggerNodes = nodes.filter((node) => node.type === 'trigger');
  if (triggerNodes.length <= 1) return nodes;
  return nodes.filter((node) => node.type !== 'trigger' || node.id === triggerNodes[0].id);
};

export const useUndoRedo = <T,>(initial: T) => {
  const stack = useRef<T[]>([initial]);
  const pointer = useRef(0);
  const [, forceRender] = useState({});

  const push = (value: T) => {
    stack.current = [...stack.current.slice(0, pointer.current + 1), value];
    pointer.current = stack.current.length - 1;
    forceRender({});
  };

  const undo = () => {
    if (pointer.current === 0) return stack.current[pointer.current];
    pointer.current -= 1;
    forceRender({});
    return stack.current[pointer.current];
  };

  const redo = () => {
    if (pointer.current >= stack.current.length - 1) return stack.current[pointer.current];
    pointer.current += 1;
    forceRender({});
    return stack.current[pointer.current];
  };

  const current = () => stack.current[pointer.current];

  return { push, undo, redo, current };
};

export const useLocalStorage = <T,>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to persist to localStorage', error);
    }
  }, [key, value]);

  return [value, setValue] as const;
};

export const debounce = <Fn extends (...args: never[]) => unknown>(fn: Fn, delay = 300) => {
  let handle: number | undefined;
  return (...args: Parameters<Fn>) => {
    window.clearTimeout(handle);
    handle = window.setTimeout(() => fn(...args), delay);
  };
};

export const useAutosave = (flow: AutomationFlow, onSave: (draft: AutomationFlow) => void, delay = 1500) => {
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  useEffect(() => {
    const handler = window.setTimeout(() => saveRef.current(flow), delay);
    return () => window.clearTimeout(handler);
  }, [flow, delay]);
};

export const createDefaultFlow = (): AutomationFlow => ({
  id: generateId('flow'),
  name: 'New automation',
  status: 'DRAFT',
  nodes: [],
  edges: [],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const isValidFlow = (candidate: unknown): candidate is AutomationFlow => {
  const parsed = automationFlowSchema.safeParse(candidate);
  return parsed.success;
};

export const migrateFlow = (flow: AutomationFlow): AutomationFlow => ({
  ...flow,
  nodes: layoutNodes(ensureSingleTrigger(flow.nodes)),
  edges: removeDanglingEdges(flow.edges, flow.nodes),
});

export const useKeyPress = (callback: (event: KeyboardEvent) => void) => {
  const cb = useCallback(callback, [callback]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => cb(event);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cb]);
};

export const getFlowStorageKey = (flowId: string) => `automation_flow_${flowId}`;
export const FLOWS_COLLECTION_KEY = 'leadsbox_flows';
export const FLOW_DRAFT_KEY = 'automation_draft';
