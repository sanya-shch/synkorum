import { toast } from "sonner";
import { MAX_LAYERS } from "@/lib/constants";

// Shown whenever an insert / duplicate is refused because the board is full. The fixed id
// makes sonner replace the toast instead of stacking one per attempt.
export const notifyLayerLimit = () =>
  toast.error(`Board limit reached: up to ${MAX_LAYERS} shapes per board.`, { id: "layer-limit" });
