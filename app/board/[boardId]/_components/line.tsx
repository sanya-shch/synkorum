import { colorToCss } from "@/lib/canvas/color";
import { getArrowheadPoints } from "@/lib/canvas/line";
import { LineLayer } from "@/types/canvas";

interface LineProps {
  id: string;
  layer: LineLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const ARROWHEAD_SIZE = 12;

export const Line = ({ id, layer, onPointerDown, selectionColor }: LineProps) => {
  const { x, y, width, height, flipX, flipY, fill } = layer;

  // Local coordinates within the box, same convention as the other shapes (the <g>
  // below is translated to (x, y), so 0,0 is the box's own top-left corner).
  const start = { x: flipX ? width : 0, y: flipY ? height : 0 };
  const end = { x: flipX ? 0 : width, y: flipY ? 0 : height };
  const color = fill ? colorToCss(fill) : "#000";

  return (
    <g
      className="drop-shadow-md"
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      {/* Invisible wide hit-area - a 2px line is nearly impossible to click directly. */}
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth={20} />

      {selectionColor && (
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={selectionColor}
          strokeWidth={5}
          strokeLinecap="round"
        />
      )}

      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <polygon points={getArrowheadPoints(start, end, ARROWHEAD_SIZE)} fill={color} />
    </g>
  );
};
