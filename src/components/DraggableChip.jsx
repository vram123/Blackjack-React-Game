import React from "react";
import { useDrag } from "react-dnd";

const ItemTypes = { CHIP: "chip" };

export default function DraggableChip({ value, color, disabled = false }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.CHIP,
      item: { value, color },
      canDrag: () => !disabled,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [disabled, value, color]
  );

  return (
    <div
      ref={drag}
      className={`chip ${color} ${disabled ? "chip--disabled" : ""}`}
      style={{ opacity: disabled ? 0.45 : isDragging ? 0.5 : 1 }}
      title={
        disabled
          ? "Betting is locked during a hand"
          : `Drag ${value} onto the bet circle`
      }
    >
      {value}
    </div>
  );
}

export { ItemTypes };
