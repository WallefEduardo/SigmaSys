import type { Position, Dimensions, Block } from '../types/flow.types';

// Distance calculations
export const getDistance = (a: Position, b: Position): number => {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
};

// Check if point is inside rectangle
export const isPointInRect = (
  point: Position,
  rect: { position: Position; dimensions: Dimensions }
): boolean => {
  return (
    point.x >= rect.position.x &&
    point.x <= rect.position.x + rect.dimensions.width &&
    point.y >= rect.position.y &&
    point.y <= rect.position.y + rect.dimensions.height
  );
};

// Get center point of a block
export const getBlockCenter = (block: Block): Position => {
  const width = block.dimensions?.width || 200;
  const height = block.dimensions?.height || 100;
  
  return {
    x: block.position.x + width / 2,
    y: block.position.y + height / 2,
  };
};

// Get connection point position
export const getConnectionPointPosition = (
  block: Block,
  side: 'top' | 'bottom' | 'left' | 'right',
  offset?: Position
): Position => {
  const width = block.dimensions?.width || 200;
  const height = block.dimensions?.height || 100;
  const { x, y } = block.position;

  let point: Position;

  switch (side) {
    case 'top':
      point = { x: x + width / 2, y };
      break;
    case 'bottom':
      point = { x: x + width / 2, y: y + height };
      break;
    case 'left':
      point = { x, y: y + height / 2 };
      break;
    case 'right':
      point = { x: x + width, y: y + height / 2 };
      break;
  }

  if (offset) {
    point.x += offset.x;
    point.y += offset.y;
  }

  return point;
};

// Calculate bezier curve path for connections
export const getBezierPath = (
  start: Position,
  end: Position,
  curvature = 0.25
): string => {
  const hx1 = start.x;
  const hy1 = start.y;
  const hx2 = end.x;
  const hy2 = end.y;

  const dx = Math.abs(hx2 - hx1) * curvature;

  const c1x = hx1 + dx;
  const c1y = hy1;
  const c2x = hx2 - dx;
  const c2y = hy2;

  return `M${hx1},${hy1} C${c1x},${c1y} ${c2x},${c2y} ${hx2},${hy2}`;
};

// Smooth step path for connections
export const getSmoothStepPath = (
  start: Position,
  end: Position,
  borderRadius = 5
): string => {
  const { x: sx, y: sy } = start;
  const { x: ex, y: ey } = end;

  const xDiff = Math.abs(sx - ex);
  const yDiff = Math.abs(sy - ey);
  const mx = sx < ex ? sx + xDiff / 2 : sx - xDiff / 2;

  if (xDiff >= yDiff) {
    return `M${sx},${sy}L${mx},${sy}L${mx},${ey}L${ex},${ey}`;
  }

  const my = sy < ey ? sy + yDiff / 2 : sy - yDiff / 2;
  return `M${sx},${sy}L${sx},${my}L${ex},${my}L${ex},${ey}`;
};

// Snap to grid
export const snapToGrid = (position: Position, gridSize = 20): Position => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};

// Check if blocks overlap
export const blocksOverlap = (block1: Block, block2: Block): boolean => {
  const w1 = block1.dimensions?.width || 200;
  const h1 = block1.dimensions?.height || 100;
  const w2 = block2.dimensions?.width || 200;
  const h2 = block2.dimensions?.height || 100;

  return !(
    block1.position.x + w1 < block2.position.x ||
    block2.position.x + w2 < block1.position.x ||
    block1.position.y + h1 < block2.position.y ||
    block2.position.y + h2 < block1.position.y
  );
};

// Find nearest snap position (for alignment guides)
export const findNearestSnapPosition = (
  position: Position,
  blocks: Block[],
  threshold = 10
): Position => {
  const snapPositions: Position[] = [];

  // Collect all possible snap positions from other blocks
  blocks.forEach((block) => {
    const width = block.dimensions?.width || 200;
    const height = block.dimensions?.height || 100;

    // Add edge positions
    snapPositions.push(
      { x: block.position.x, y: position.y }, // Left edge
      { x: block.position.x + width, y: position.y }, // Right edge
      { x: position.x, y: block.position.y }, // Top edge
      { x: position.x, y: block.position.y + height }, // Bottom edge
      { x: block.position.x, y: block.position.y }, // Top-left
      { x: block.position.x + width, y: block.position.y + height } // Bottom-right
    );
  });

  // Find closest snap position within threshold
  let closestSnap = position;
  let minDistance = threshold;

  snapPositions.forEach((snap) => {
    const distance = getDistance(position, snap);
    if (distance < minDistance) {
      minDistance = distance;
      closestSnap = snap;
    }
  });

  return closestSnap;
};