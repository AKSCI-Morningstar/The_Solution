"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { cn } from "@/shared/utils";

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

const ENTITY_TYPE_LABELS: Record<string, string> = {
  COMPONENT: "Component",
  ASSEMBLY: "Assembly",
  SYSTEM: "System",
  SUBSYSTEM: "Subsystem",
  REQUIREMENT: "Requirement",
  SPECIFICATION: "Specification",
  INTERFACE: "Interface",
  MATERIAL: "Material",
  SUPPLIER: "Supplier",
  MANUFACTURER: "Manufacturer",
  PART_NUMBER: "Part Number",
  DRAWING: "Drawing",
  CAD_MODEL: "CAD Model",
  TEST: "Test",
  CERTIFICATION: "Certification",
  PROCESS: "Process",
  FACILITY: "Facility",
  STANDARD: "Standard",
  ENGINEERING_CHANGE: "Engineering Change",
  DOCUMENT_REFERENCE: "Document Reference",
  EVIDENCE_REFERENCE: "Evidence Reference",
};

const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  DEPENDS_ON: "Depends On",
  CONTAINS: "Contains",
  IMPLEMENTS: "Implements",
  VERIFIES: "Verifies",
  REFERENCES: "References",
  MANUFACTURED_BY: "Manufactured By",
  SUPPLIED_BY: "Supplied By",
  TESTED_BY: "Tested By",
  CERTIFIED_BY: "Certified By",
  DERIVED_FROM: "Derived From",
  SUPERSEDES: "Supersedes",
};

export function GraphViewer({ nodes, edges, onNodeClick, onEdgeClick }: GraphViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showLegend, setShowLegend] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
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

  const activeNodeTypes = useMemo(() => {
    const types = new Set<string>();
    nodes.forEach((n) => types.add(n.entityType));
    return Array.from(types).sort();
  }, [nodes]);

  const activeEdgeTypes = useMemo(() => {
    const types = new Set<string>();
    edges.forEach((e) => types.add(e.relationshipType));
    return Array.from(types).sort();
  }, [edges]);

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

  const drawMiniMap = useCallback(() => {
    const miniCanvas = miniMapRef.current;
    if (!miniCanvas || !showMiniMap) return;
    const ctx = miniCanvas.getContext("2d");
    if (!ctx) return;

    const MW = 140;
    const MH = 100;
    miniCanvas.width = MW * devicePixelRatio;
    miniCanvas.height = MH * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, MW, MH);

    if (nodes.length === 0) return;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const node of nodes) {
      const pos = positions[node.id];
      if (!pos) continue;
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }
    if (minX === Infinity) return;

    const padding = 10;
    const rangeX = Math.max(1, maxX - minX);
    const rangeY = Math.max(1, maxY - minY);
    const scale = Math.min((MW - padding * 2) / rangeX, (MH - padding * 2) / rangeY);

    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0, 0, MW, MH);

    edges.forEach((edge) => {
      const src = positions[edge.sourceNode.id];
      const tgt = positions[edge.targetNode.id];
      if (!src || !tgt) return;
      ctx.beginPath();
      ctx.moveTo(padding + (src.x - minX) * scale, padding + (src.y - minY) * scale);
      ctx.lineTo(padding + (tgt.x - minX) * scale, padding + (tgt.y - minY) * scale);
      ctx.strokeStyle = "rgba(107,114,128,0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;
      ctx.beginPath();
      ctx.arc(
        padding + (pos.x - minX) * scale,
        padding + (pos.y - minY) * scale,
        2,
        0,
        2 * Math.PI,
      );
      ctx.fillStyle = getNodeColor(node.entityType);
      ctx.fill();
    });

    const viewW = (dimensions.width / zoom) * scale;
    const viewH = (dimensions.height / zoom) * scale;
    const viewX = padding + (-pan.x / zoom - minX) * scale;
    const viewY = padding + (-pan.y / zoom - minY) * scale;
    ctx.strokeStyle = "rgba(59,130,246,0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
  }, [nodes, edges, positions, pan, zoom, dimensions, showMiniMap]);

  const miniMapRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawMiniMap();
  }, [drawMiniMap]);

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
      className="border-border bg-background relative size-full overflow-hidden rounded-lg border"
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

      <div className="border-border bg-background/90 absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-sm backdrop-blur-sm">
        <button
          onClick={() => setZoom((z) => Math.min(5, z * 1.2))}
          className="hover:bg-surface-hover text-muted-foreground hover:text-foreground rounded px-1.5 py-0.5"
        >
          +
        </button>
        <span className="text-muted-foreground min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(0.1, z / 1.2))}
          className="hover:bg-surface-hover text-muted-foreground hover:text-foreground rounded px-1.5 py-0.5"
        >
          &minus;
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="hover:bg-surface-hover text-muted-foreground hover:text-foreground ml-1 rounded px-1.5 py-0.5"
        >
          Reset
        </button>
        <div className="border-border mx-1 h-4 border-l" />
        <button
          onClick={() => setShowLegend((v) => !v)}
          className={cn(
            "rounded px-1.5 py-0.5",
            showLegend
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Legend
        </button>
        <button
          onClick={() => setShowMiniMap((v) => !v)}
          className={cn(
            "rounded px-1.5 py-0.5",
            showMiniMap
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Mini-map
        </button>
      </div>

      <div className="text-muted-foreground absolute right-3 bottom-3 text-xs">
        {nodes.length} nodes &middot; {edges.length} edges
      </div>

      {showMiniMap && (
        <canvas
          ref={miniMapRef}
          className="border-border bg-background/90 absolute top-3 right-3 rounded border shadow-sm backdrop-blur-sm"
          style={{ width: 140, height: 100 }}
        />
      )}

      {showLegend && (
        <div className="border-border bg-background/90 absolute top-3 left-3 max-h-[60vh] overflow-y-auto rounded-lg border p-3 shadow-sm backdrop-blur-sm">
          <h4 className="text-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Legend
          </h4>
          {activeNodeTypes.length > 0 && (
            <div className="mb-3">
              <p className="text-muted-foreground mb-1.5 text-[11px] font-medium">Nodes</p>
              <div className="flex flex-col gap-1">
                {activeNodeTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: getNodeColor(type) }}
                    />
                    <span className="text-foreground text-xs">
                      {ENTITY_TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeEdgeTypes.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1.5 text-[11px] font-medium">Edges</p>
              <div className="flex flex-col gap-1">
                {activeEdgeTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <span
                      className="h-0.5 w-4 shrink-0 rounded"
                      style={{ backgroundColor: getEdgeColor(type) }}
                    />
                    <span className="text-foreground text-xs">
                      {RELATIONSHIP_TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
