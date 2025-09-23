import { FC, useMemo } from 'react';
import { CanvasNode, CanvasEdge } from '../types';
import { cn } from '@/lib/utils';

interface MinimapProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  scale: number;
  pan: { x: number; y: number };
}

const MINIMAP_SCALE = 0.12;

const Minimap: FC<MinimapProps> = ({ nodes, edges, scale, pan }) => {
  const viewportStyle = useMemo(() => ({
    transform: `translate(${-pan.x * MINIMAP_SCALE}px, ${-pan.y * MINIMAP_SCALE}px) scale(${scale * MINIMAP_SCALE})`,
  }), [pan.x, pan.y, scale]);

  return (
    <div className='pointer-events-none absolute bottom-6 right-6 hidden h-40 w-60 overflow-hidden rounded-md border border-border bg-card/80 shadow-md backdrop-blur lg:block'>
      <div className='relative h-full w-full bg-slate-900/40'>
        <svg className='absolute left-0 top-0 h-full w-full text-primary/40'>
          {edges.map((edge) => {
            const fromNode = nodes.find((node) => node.id === edge.from);
            const toNode = nodes.find((node) => node.id === edge.to);
            if (!fromNode || !toNode) return null;

            const startX = fromNode.x * MINIMAP_SCALE + 20;
            const startY = fromNode.y * MINIMAP_SCALE + 20;
            const endX = toNode.x * MINIMAP_SCALE + 20;
            const endY = toNode.y * MINIMAP_SCALE + 20;

            return <line key={edge.id} x1={startX} y1={startY} x2={endX} y2={endY} stroke='currentColor' strokeWidth={1} />;
          })}
        </svg>
        {nodes.map((node) => (
          <div
            key={node.id}
            className={cn('absolute rounded-sm border border-white/40', {
              'bg-emerald-500/50': node.type === 'trigger',
              'bg-sky-500/50': node.type === 'condition',
              'bg-fuchsia-500/50': node.type === 'action',
            })}
            style={{
              width: 36,
              height: 20,
              transform: `translate(${node.x * MINIMAP_SCALE}px, ${node.y * MINIMAP_SCALE}px)`,
            }}
          />
        ))}
        <div
          className='absolute left-0 top-0 h-full w-full border border-primary/60'
          style={viewportStyle}
        />
      </div>
    </div>
  );
};

export default Minimap;
