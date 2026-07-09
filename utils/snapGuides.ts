import { Layer } from '../types';

// ---------------------------------------------------------------
// Smart Guides & Snap System — Milestone 11
// Calculates snap positions for alignment with other layers,
// canvas center, and canvas edges.
// ---------------------------------------------------------------

export interface SnapGuide {
  orientation: 'horizontal' | 'vertical';
  position: number; // px in canvas space
  source: 'center' | 'edge' | 'layer';
  label?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
  snappedX: boolean;
  snappedY: boolean;
}

const SNAP_THRESHOLD = 5; // px — how close before snapping

/**
 * Calculate snap position for a layer being moved.
 * Snaps to canvas center, canvas edges, and other layer edges/centers.
 */
export function calculateSnap(
  dragX: number,
  dragY: number,
  dragWidth: number,
  dragHeight: number,
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number,
  excludeLayerId?: string,
): SnapResult {
  const guides: SnapGuide[] = [];
  let snappedX = false;
  let snappedY = false;
  let finalX = dragX;
  let finalY = dragY;

  const dragCenterX = dragX + dragWidth / 2;
  const dragCenterY = dragY + dragHeight / 2;
  const dragRight = dragX + dragWidth;
  const dragBottom = dragY + dragHeight;

  // Snap targets for X
  const xTargets: Array<{ value: number; source: SnapGuide['source']; label?: string }> = [
    { value: 0, source: 'edge', label: 'Left edge' },
    { value: canvasWidth / 2, source: 'center', label: 'Center X' },
    { value: canvasWidth, source: 'edge', label: 'Right edge' },
  ];

  // Snap targets for Y
  const yTargets: Array<{ value: number; source: SnapGuide['source']; label?: string }> = [
    { value: 0, source: 'edge', label: 'Top edge' },
    { value: canvasHeight / 2, source: 'center', label: 'Center Y' },
    { value: canvasHeight, source: 'edge', label: 'Bottom edge' },
  ];

  // Add other layers as snap targets
  for (const layer of layers) {
    if (layer.id === excludeLayerId || !layer.visible) continue;

    const lCenterX = layer.x + layer.width / 2;
    const lCenterY = layer.y + layer.height / 2;

    // Vertical guides (X alignment)
    xTargets.push(
      { value: layer.x, source: 'layer' },
      { value: lCenterX, source: 'layer' },
      { value: layer.x + layer.width, source: 'layer' },
    );

    // Horizontal guides (Y alignment)
    yTargets.push(
      { value: layer.y, source: 'layer' },
      { value: lCenterY, source: 'layer' },
      { value: layer.y + layer.height, source: 'layer' },
    );
  }

  // Find best X snap
  // Check left edge, center, right edge of dragged element
  const xEdges = [
    { edge: dragX, offset: 0 },        // left
    { edge: dragCenterX, offset: dragWidth / 2 },  // center
    { edge: dragRight, offset: dragWidth },         // right
  ];

  let bestXDist = SNAP_THRESHOLD + 1;
  let bestXTarget: typeof xTargets[0] | null = null;
  let bestXEdge: typeof xEdges[0] | null = null;

  for (const edge of xEdges) {
    for (const target of xTargets) {
      const dist = Math.abs(edge.edge - target.value);
      if (dist < bestXDist) {
        bestXDist = dist;
        bestXTarget = target;
        bestXEdge = edge;
      }
    }
  }

  if (bestXTarget && bestXEdge && bestXDist <= SNAP_THRESHOLD) {
    finalX = bestXTarget.value - bestXEdge.offset;
    snappedX = true;
    guides.push({
      orientation: 'vertical',
      position: bestXTarget.value,
      source: bestXTarget.source,
      label: bestXTarget.label,
    });
  }

  // Find best Y snap
  const yEdges = [
    { edge: dragY, offset: 0 },
    { edge: dragCenterY, offset: dragHeight / 2 },
    { edge: dragBottom, offset: dragHeight },
  ];

  let bestYDist = SNAP_THRESHOLD + 1;
  let bestYTarget: typeof yTargets[0] | null = null;
  let bestYEdge: typeof yEdges[0] | null = null;

  for (const edge of yEdges) {
    for (const target of yTargets) {
      const dist = Math.abs(edge.edge - target.value);
      if (dist < bestYDist) {
        bestYDist = dist;
        bestYTarget = target;
        bestYEdge = edge;
      }
    }
  }

  if (bestYTarget && bestYEdge && bestYDist <= SNAP_THRESHOLD) {
    finalY = bestYTarget.value - bestYEdge.offset;
    snappedY = true;
    guides.push({
      orientation: 'horizontal',
      position: bestYTarget.value,
      source: bestYTarget.source,
      label: bestYTarget.label,
    });
  }

  return { x: finalX, y: finalY, guides, snappedX, snappedY };
}

/**
 * Render snap guide lines as absolute-positioned elements.
 * Returns an array of CSS properties for each guide line.
 */
export function getGuideLineStyle(guide: SnapGuide, canvasWidth: number, canvasHeight: number): Record<string, string | number> {
  if (guide.orientation === 'vertical') {
    return {
      position: 'absolute',
      left: `${guide.position}px`,
      top: 0,
      width: '1px',
      height: `${canvasHeight}px`,
      backgroundColor: guide.source === 'center' ? '#6366f1' : '#f472b6',
      opacity: 0.6,
      pointerEvents: 'none',
      zIndex: 999,
    };
  }
  return {
    position: 'absolute',
    top: `${guide.position}px`,
    left: 0,
    height: '1px',
    width: `${canvasWidth}px`,
    backgroundColor: guide.source === 'center' ? '#6366f1' : '#f472b6',
    opacity: 0.6,
    pointerEvents: 'none',
    zIndex: 999,
  };
}
