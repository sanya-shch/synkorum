import { colorToCss } from "@/lib/canvas/color";
import { DiamondLayer } from "@/types/canvas";

interface DiamondProps {
  id: string;
  layer: DiamondLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const Diamond = ({ id, layer, onPointerDown, selectionColor }: DiamondProps) => {
  const { x, y, width, height, fill } = layer;

  // A diamond inscribed in the bounding box: top/right/bottom/left midpoints.
  const points = [
    [width / 2, 0],
    [width, height / 2],
    [width / 2, height],
    [0, height / 2],
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(" ");

  return (
    <polygon
      className="drop-shadow-md"
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
      points={points}
      fill={fill ? colorToCss(fill) : "#000"}
      stroke={selectionColor || "transparent"}
      strokeWidth={1}
    />
  );
};
