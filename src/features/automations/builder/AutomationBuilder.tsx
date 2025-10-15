import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DndContext, DragEndEvent, DragMoveEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { notify } from '@/lib/toast';
import Toolbar from './Toolbar';
import Palette from './Palette';
import Canvas from './Canvas';
import Inspector from './Inspector';
import Minimap from './minimap/Minimap';
import { FLOWS_COLLECTION_KEY, FLOW_DRAFT_KEY, createDefaultFlow, generateId, migrateFlow, removeDanglingEdges, snapToGrid, useAutosave, useKeyPress, useLocalStorage, useUndoRedo } from './utils';
import { AutomationFlow, CanvasEdge, CanvasNode, AutomationNodeType } from './types';
import { validateFlow } from './serializers';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AutomationBuilderProps {
  initialFlow?: AutomationFlow;
  onClose: (response?: { saved?: boolean; flow?: AutomationFlow }) => void;
  onSave?: (flow: AutomationFlow) => void;
}

type ConnectingState = {
  nodeId: string;
  direction: 'input' | 'output';
  branch?: 'true' | 'false';
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const AutomationBuilder: React.FC<AutomationBuilderProps> = ({ initialFlow, onClose, onSave }) => {
  const [storedFlows, setStoredFlows] = useLocalStorage<AutomationFlow[]>(FLOWS_COLLECTION_KEY, []);

  const startingFlow = useMemo(() => migrateFlow(initialFlow ?? createDefaultFlow()), [initialFlow]);
  const [flow, setFlow] = useState<AutomationFlow>(startingFlow);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<ConnectingState | null>(null);
  const undoRedo = useUndoRedo(flow);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 160, y: 120 });
  const [isPanning, setIsPanning] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showPaletteSheet, setShowPaletteSheet] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null);
  const [latestPointer, setLatestPointer] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useAutosave(flow, (draft) => {
    if (!touched) return;
    window.localStorage.setItem(FLOW_DRAFT_KEY, JSON.stringify(draft));
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const updateFlow = useCallback((updater: (current: AutomationFlow) => AutomationFlow, pushHistory = true) => {
    setFlow((current) => {
      const updated = migrateFlow(updater(current));
      if (pushHistory) undoRedo.push(updated);
      return updated;
    });
    setTouched(true);
  }, [undoRedo]);

  const handleDragStart = (event: DragStartEvent) => {
    if ('clientX' in event.activatorEvent && 'clientY' in event.activatorEvent) {
      setDragOrigin({ x: event.activatorEvent.clientX, y: event.activatorEvent.clientY });
      setLatestPointer({ x: event.activatorEvent.clientX, y: event.activatorEvent.clientY });
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (dragOrigin) {
      setLatestPointer({ x: dragOrigin.x + event.delta.x, y: dragOrigin.y + event.delta.y });
    }
  };

  const addNodeFromPalette = (type: AutomationNodeType, payload: Record<string, unknown>, position: { x: number; y: number }) => {
    updateFlow((current) => {
      const node: CanvasNode = {
        id: generateId(type),
        type,
        x: snapToGrid(position.x),
        y: snapToGrid(position.y),
        ...(type === 'trigger'
          ? { trigger: payload.trigger }
          : type === 'condition'
            ? { conditions: payload.conditions ?? [], mode: payload.mode ?? 'AND' }
            : { action: payload.action }),
      } as CanvasNode;

      const nodes = type === 'trigger'
        ? current.nodes.filter((existing) => existing.type !== 'trigger').concat(node)
        : [...current.nodes, node];

      return {
        ...current,
        nodes,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const data = active.data.current as { source?: string; nodeId?: string; type?: AutomationNodeType; payload?: Record<string, unknown> } | undefined;

    if (data?.source === 'palette' && over?.id === 'automation-canvas' && data.type && data.payload) {
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (!canvasBounds || !latestPointer) return;
      const canvasX = (latestPointer.x - canvasBounds.left - pan.x) / scale;
      const canvasY = (latestPointer.y - canvasBounds.top - pan.y) / scale;
      addNodeFromPalette(data.type, data.payload, { x: canvasX, y: canvasY });
      setShowPaletteSheet(false);
    }

    if (data?.source === 'canvas-node') {
      const delta = event.delta;
      const dx = delta.x / scale;
      const dy = delta.y / scale;
      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        updateFlow((current) => ({
          ...current,
          nodes: current.nodes.map((node) =>
            node.id === data.nodeId
              ? { ...node, x: snapToGrid(node.x + dx), y: snapToGrid(node.y + dy) }
              : node
          ),
        }));
      }
    }

    setDragOrigin(null);
    setLatestPointer(null);
  };

  const handleNodeMove = useCallback((nodeId: string, delta: { x: number; y: number }) => {
    // live preview not persisted; optional for guidelines
  }, []);

  const handleNodeMoveEnd = useCallback((nodeId: string, delta: { x: number; y: number }) => {
    const dx = delta.x / scale;
    const dy = delta.y / scale;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    updateFlow((current) => ({
      ...current,
      nodes: current.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, x: snapToGrid(node.x + dx), y: snapToGrid(node.y + dy) }
          : node
      ),
    }));
  }, [scale, updateFlow]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<CanvasNode>) => {
    updateFlow((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } as CanvasNode : node)),
    }));
  }, [updateFlow]);

  const handleStartConnection = useCallback((nodeId: string, direction: 'input' | 'output', branch?: 'true' | 'false') => {
    setConnectingFrom((state) => {
      if (!state) {
        return { nodeId, direction, branch };
      }

      if (direction === 'output') {
        return { nodeId, direction, branch };
      }

      if (state.nodeId === nodeId) {
        return null;
      }

      updateFlow((current) => {
        const edge: CanvasEdge = {
          id: generateId('edge'),
          from: state.nodeId,
          to: nodeId,
        };
        const edges = removeDanglingEdges([...current.edges, edge], current.nodes);
        return { ...current, edges };
      });
      return null;
    });
  }, [updateFlow]);

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.target !== event.currentTarget) return;
    setSelectedNodeId(null);
    setConnectingFrom(null);
    setIsPanning(true);
    const start = { x: event.clientX, y: event.clientY };
    const startPan = pan;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - start.x);
      const dy = (moveEvent.clientY - start.y);
      setPan({ x: startPan.x + dx, y: startPan.y + dy });
    };

    const handleUp = () => {
      setIsPanning(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleValidate = () => {
    const result = validateFlow(flow);
    if (result.ok) {
      notify.success({
        key: 'automations:builder:valid',
        title: 'Automation looks good',
      });
    } else {
      notify.error({
        key: 'automations:builder:invalid',
        title: 'Fix automation issues',
        description: result.issues.join(' • '),
      });
    }
    return result;
  };

  const handlePreview = () => {
    notify.info({
      key: 'automations:builder:preview',
      title: 'Preview coming soon',
      description: 'We will simulate the journey here shortly.',
    });
  };

  const persistFlow = (updated: AutomationFlow) => {
    const nextCollection = storedFlows.some((item) => item.id === updated.id)
      ? storedFlows.map((item) => (item.id === updated.id ? updated : item))
      : [...storedFlows, updated];
    setStoredFlows(nextCollection);
    onSave?.(updated);
    notify.success({
      key: 'automations:builder:saved',
      title: 'Automation saved',
      description: 'Draft stored locally. Publish when you are ready.',
    });
  };

  const handleSaveDraft = () => {
    const result = handleValidate();
    if (!result.ok) return;
    const saved = { ...flow, status: 'DRAFT', updatedAt: new Date().toISOString() };
    persistFlow(saved);
    setTouched(false);
    onClose({ saved: true, flow: saved });
  };

  const handleExit = () => {
    if (touched) {
      const confirmExit = window.confirm('You have unsaved changes. Exit without saving?');
      if (!confirmExit) return;
    }
    onClose();
  };

  const handleUndo = () => {
    const previous = undoRedo.undo();
    if (previous) {
      setFlow(previous);
    }
  };

  const handleRedo = () => {
    const next = undoRedo.redo();
    if (next) {
      setFlow(next);
    }
  };

  useKeyPress((event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!selectedNodeId) return;
      event.preventDefault();
      updateFlow((current) => ({
        ...current,
        nodes: current.nodes.filter((node) => node.id !== selectedNodeId),
        edges: current.edges.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId),
      }));
      setSelectedNodeId(null);
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd' && selectedNodeId) {
      event.preventDefault();
      updateFlow((current) => {
        const node = current.nodes.find((candidate) => candidate.id === selectedNodeId);
        if (!node) return current;
        const clone: CanvasNode = {
          ...node,
          id: generateId(node.type),
          x: snapToGrid(node.x + 40),
          y: snapToGrid(node.y + 40),
        } as CanvasNode;
        return { ...current, nodes: [...current.nodes, clone] };
      });
    }
  });

  const status = useMemo(() => validateFlow(flow), [flow]);

  return (
    <div className='flex h-full flex-col bg-background'>
      <Toolbar
        flow={flow}
        validation={status}
        onValidate={handleValidate}
        onPreview={handlePreview}
        onSaveDraft={handleSaveDraft}
        onExit={handleExit}
        onZoomIn={() => setScale((value) => clamp(value + 0.1, 0.5, 1.6))}
        onZoomOut={() => setScale((value) => clamp(value - 0.1, 0.5, 1.6))}
        onZoomReset={() => setScale(1)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className='flex flex-1 overflow-hidden'>
          <div className='hidden h-full w-[280px] border-r border-border bg-card/70 backdrop-blur lg:block'>
            <Palette />
          </div>
          <div className='relative flex-1 overflow-hidden'>
            <Canvas
              nodes={flow.nodes}
              edges={flow.edges}
              selectedNodeId={selectedNodeId}
              connectingFrom={connectingFrom?.nodeId ?? null}
              scale={scale}
              pan={pan}
              onCanvasPointerDown={handleCanvasPointerDown}
              onNodeSelect={(id) => setSelectedNodeId(id)}
              onNodeMove={handleNodeMove}
              onNodeMoveEnd={handleNodeMoveEnd}
              onStartConnection={handleStartConnection}
              canvasRef={canvasRef}
            />
            <Minimap nodes={flow.nodes} edges={flow.edges} scale={scale} pan={pan} />
            <div className='absolute left-4 top-4 flex items-center gap-3 lg:hidden'>
              <Sheet open={showPaletteSheet} onOpenChange={setShowPaletteSheet}>
                <SheetTrigger asChild>
                  <Button size='sm' variant='secondary'>Blocks</Button>
                </SheetTrigger>
                <SheetContent side='left' className='w-[85vw] max-w-sm overflow-y-auto p-4'>
                  <SheetHeader>
                    <SheetTitle>Automation blocks</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className='mt-4 h-[calc(100vh-160px)] pr-2'>
                    <Palette />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              {selectedNodeId && (
                <Badge variant='secondary'>Node: {selectedNodeId}</Badge>
              )}
            </div>
          </div>
          <Inspector
            node={flow.nodes.find((node) => node.id === selectedNodeId) ?? null}
            onUpdate={handleNodeUpdate}
          />
        </div>
      </DndContext>
    </div>
  );
};

export default AutomationBuilder;
