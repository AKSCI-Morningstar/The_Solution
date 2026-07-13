"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";

interface GraphNode {
  id: string;
  entityId: string;
  label: string;
  entityType: string;
  status: string;
}

interface GraphEdge {
  id: string;
  relationshipType: string;
  sourceNode: { id: string };
  targetNode: { id: string };
}

interface GraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

const NODE_RADIUS = 28;
const NODE_COLORS: Record<string, string> = {
  COMPONENT: "#3b82f6",
  ASSEMBLY: "#6366f1",
  SYSTEM: "#8b5cf6",
  SUBSYSTEM: "#a855f7",
  REQUIREMENT: "#f59e0b",
  SPECIFICATION: "#f97316",
  INTERFACE: "#06b6d4",
  MATERIAL: "#14b8a6",
  SUPPLIER: "#10b981",
  MANUFACTURER: "#22c55e",
  PART_NUMBER: "#84cc16",
  DRAWING: "#0ea5e9",
  CAD_MODEL: "#3b82f6",
  TEST: "#f43f5e",
  CERTIFICATION: "#ec4899",
  PROCESS: "#d946ef",
  FACILITY: "#64748b",
  STANDARD: "#6b7280",
  ENGINEERING_CHANGE: "#ef4444",
  DOCUMENT_REFERENCE: "#eab308",
  EVIDENCE_REFERENCE: "#f97316",
};

const EDGE_COLORS: Record<string, string> = {
  DEPENDS_ON: "#92400e",
  CONTAINS: "#1e40af",
  IMPLEMENTS: "#166534",
  VERIFIES: "#0e7490",
  REFERENCES: "#4b5563",
  MANUFACTURED_BY: "#7c3aed",
  SUPPLIED_BY: "#be185d",
  TESTED_BY: "#0d9488",
  CERTIFIED_BY: "#115e59",
  DERIVED_FROM: "#4338ca",
  SUPERSEDES: "#b91c1c",
};

function getNodeColor(type: string): string {
  return NODE_COLORS[type] ?? "#6b7280";
}

function getEdgeColor(type: string): string {
  return EDGE_COLORS[type] ?? "#6b7280";
}

export function GraphViewer({ nodes, edges, onNodeClick, onEdgeClick }: GraphViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    if (nodes.length === 0) return pos;
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      pos[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return pos;
  }, [nodes, dimensions.width, dimensions.height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width * devicePixelRatio;
    canvas.height = dimensions.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    edges.forEach((edge) => {
      const src = positions[edge.sourceNode.id];
      const tgt = positions[edge.targetNode.id];
      if (!src || !tgt) return;

      const isSelected = selectedEdge === edge.id;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isSelected ? "#ef4444" : getEdgeColor(edge.relationshipType);
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.globalAlpha = isSelected ? 1 : 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;

      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      ctx.fillStyle = "#6b7280";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(edge.relationshipType.replace(/_/g, " "), mx, my - 6);
    });

    nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;

      const isSelected = selectedNode === node.id;
      const color = getNodeColor(node.entityType);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#ef4444" : color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label.slice(0, 3).toUpperCase(), pos.x, pos.y);

      ctx.fillStyle = "#1f2937";
      ctx.font = "10px sans-serif";
      ctx.textBaseline = "top";
      const label = node.label.length > 16 ? node.label.slice(0, 16) + "..." : node.label;
      ctx.fillText(label, pos.x, pos.y + NODE_RADIUS + 4);
    });

    ctx.restore();
  }, [nodes, edges, positions, selectedNode, selectedEdge, zoom, pan, dimensions]);

  useEffect(() => {
    draw();
  }, [draw]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.1, Math.min(5, z * delta)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;

    for (const node of nodes) {
      const pos = positions[node.id];
      if (!pos) continue;
      const dx = mx - pos.x;
      const dy = my - pos.y;
      if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
        setSelectedNode(node.id);
        setSelectedEdge(null);
        onNodeClick?.(node);
        return;
      }
    }

    for (const edge of edges) {
      const src = positions[edge.sourceNode.id];
      const tgt = positions[edge.targetNode.id];
      if (!src || !tgt) continue;
      const mx2 = (src.x + tgt.x) / 2;
      const my2 = (src.y + tgt.y) / 2;
      const dx2 = mx - mx2;
      const dy2 = my - my2;
      if (dx2 * dx2 + dy2 * dy2 <= 100) {
        setSelectedEdge(edge.id);
        setSelectedNode(null);
        onEdgeClick?.(edge);
        return;
      }
    }

    setSelectedNode(null);
    setSelectedEdge(null);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }

  function handleMouseUp() {
    isDragging.current = false;
  }

  return (
    <div
      ref={containerRef}
      className="relative size-full overflow-hidden rounded-lg border bg-white"
    >
      <canvas
        ref={canvasRef}
        className="size-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-xs text-gray-500 shadow-sm">
        <button
          onClick={() => setZoom((z) => Math.min(5, z * 1.2))}
          className="rounded px-1.5 py-0.5 hover:bg-gray-100"
        >
          +
        </button>
        <span className="min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.max(0.1, z / 1.2))}
          className="rounded px-1.5 py-0.5 hover:bg-gray-100"
        >
          &minus;
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="ml-1 rounded px-1.5 py-0.5 hover:bg-gray-100"
        >
          Reset
        </button>
      </div>
      <div className="absolute right-3 bottom-3 text-xs text-gray-400">
        {nodes.length} nodes &middot; {edges.length} edges
      </div>
    </div>
  );
}
