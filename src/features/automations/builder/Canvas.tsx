import React, { FC, useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import TriggerNodeView from './Node.Trigger';
import ConditionNodeView from './Node.Condition';
import ActionNodeView from './Node.Action';
import { CanvasEdge, CanvasNode } from './types';
import { cn } from '@/lib/utils';

interface CanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  connectingFrom: string | null;
  scale: number;
  pan: { x: number; y: number };
  onCanvasPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onNodeSelect: (id: string) => void;
  onNodeMove: (id: string, delta: { x: number; y: number }) => void;
  onNodeMoveEnd: (id: string, delta: { x: number; y: number }) => void;
  onStartConnection: (id: string, direction: 'input' | 'output', branch?: 'true' | 'false') => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

const GRID_SIZE = 32;

interface DraggableNodeProps {
  node: CanvasNode;
  selected: boolean;
  onNodeSelect: (id: string) => void;
  onNodeMove: (id: string, delta: { x: number; y: number }) => void;
  onNodeMoveEnd: (id: string, delta: { x: number; y: number }) => void;
  onStartConnection: (id: string, direction: 'input' | 'output', branch?: 'true' | 'false') => void;
}

const DraggableNode: FC<DraggableNodeProps> = ({
  node,
  selected,
  onNodeSelect,
  onNodeMove,
  onNodeMoveEnd,
  onStartConnection,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `canvas-node-${node.id}`,
    data: {
      source: 'canvas-node',
      nodeId: node.id,
    },
  });

  const style: React.CSSProperties = {
    left: node.x,
    top: node.y,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  };

  const commonProps = {
    selected,
    onSelect: () => onNodeSelect(node.id),
  };

  return (
    <div
      ref={setNodeRef}
      className='absolute'
      style={style}
      {...attributes}
      {...listeners}
      onPointerUp={(event) => {
        if (transform) {
          onNodeMoveEnd(node.id, { x: transform.x, y: transform.y });
        }
        event.stopPropagation();
      }}
      onPointerMove={(event) => {
        if (transform) {
          onNodeMove(node.id, { x: transform.x, y: transform.y });
        }
        event.stopPropagation();
      }}
    >
      {node.type === 'trigger' && (
        <TriggerNodeView
          node={node}
          {...commonProps}
          onStartConnection={() => onStartConnection(node.id, 'output')}
        />
      )}
      {node.type === 'condition' && (
        <ConditionNodeView
          node={node}
          {...commonProps}
          onStartConnection={(direction, branch) => onStartConnection(node.id, direction, branch)}
        />
      )}
      {node.type === 'action' && (
        <ActionNodeView
          node={node}
          {...commonProps}
          onStartConnection={() => onStartConnection(node.id, 'input')}
        />
      )}
    </div>
  );
};

const Canvas: FC<CanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  connectingFrom,
  scale,
  pan,
  onCanvasPointerDown,
  onNodeSelect,
  onNodeMove,
  onNodeMoveEnd,
  onStartConnection,
  canvasRef,
}) => {
  const { setNodeRef } = useDroppable({ id: 'automation-canvas' });

  const backgroundStyle = useMemo(() => ({
    backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
    backgroundImage:
      'linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
  }), [scale]);

  return (
    <div className='relative h-full w-full overflow-hidden bg-background' onPointerDown={onCanvasPointerDown}>
      <div
        ref={(el) => {
          setNodeRef(el);
          if (canvasRef && 'current' in canvasRef) {
            (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
        }}
        className='relative h-full w-full'
        style={backgroundStyle}
      >
        <div
          className='absolute left-0 top-0 origin-top-left'
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          <svg className='absolute left-0 top-0 h-full w-full pointer-events-none'>
            {edges.map((edge) => {
              const fromNode = nodes.find((node) => node.id === edge.from);
              const toNode = nodes.find((node) => node.id === edge.to);
              if (!fromNode || !toNode) return null;
              const startX = fromNode.x + 140;
              const startY = fromNode.y + 60;
              const endX = toNode.x - 20;
              const endY = toNode.y + 60;
              const midX = (startX + endX) / 2;

              return (
                <path
                  key={edge.id}
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  fill='none'
                  stroke='url(#edge-gradient)'
                  strokeWidth={2}
                />
              );
            })}
            <defs>
              <linearGradient id='edge-gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor='hsl(var(--primary))' stopOpacity='0.6' />
                <stop offset='100%' stopColor='hsl(var(--primary))' stopOpacity='1' />
              </linearGradient>
            </defs>
          </svg>

          {nodes.map((node) => (
            <DraggableNode
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              onNodeSelect={onNodeSelect}
              onNodeMove={onNodeMove}
              onNodeMoveEnd={onNodeMoveEnd}
              onStartConnection={onStartConnection}
            />
          ))}

          {connectingFrom && (
            <div
              className='absolute left-0 top-0 h-full w-full pointer-events-none'
              aria-hidden='true'
            >
              <div className='absolute left-0 top-0 h-full w-full animate-pulse bg-gradient-to-r from-primary/10 via-transparent to-primary/10' />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
