"use client";

import {
  useSortable,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  X,
} from "lucide-react";

type SortableDeliveryProps = {
  id: string;
  index: number;
  total: number;

  klient: {
    id: string;
    imieNazwisko: string;
    adres: string;
    godzina: string;
  };

  disabled?: boolean;

  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export default function SortableDelivery({
  id,
  index,
  total,
  klient,
  disabled = false,
  onMoveUp,
  onMoveDown,
  onRemove,
}: SortableDeliveryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(
      transform
    ),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-xl border bg-gray-50 p-4
        transition-shadow
        ${
          isDragging
            ? "z-50 border-yellow-400 bg-yellow-50 shadow-xl"
            : "border-gray-100"
        }
      `}
    >
      <div className="flex gap-3">

        {/* NUMER */}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400 font-bold text-gray-950">
          {index + 1}
        </div>

        {/* DANE */}

        <div className="min-w-0 flex-1">

          <p className="font-bold text-gray-900">
            {klient.imieNazwisko}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            🕐 {klient.godzina || "--:--"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            📍 {klient.adres}
          </p>

        </div>

        {/* PRZYCISKI */}

        <div className="flex shrink-0 items-start gap-1">

          {/* DRAG HANDLE */}

          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            title="Przeciągnij dostawę"
            className="
              cursor-grab
              touch-none
              rounded-lg
              border
              border-gray-200
              bg-white
              p-2
              text-gray-500
              transition
              hover:border-yellow-400
              hover:bg-yellow-50
              hover:text-gray-900
              active:cursor-grabbing
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            <GripVertical size={18} />
          </button>

          {/* GÓRA */}

          <button
            type="button"
            title="Przesuń w górę"
            disabled={
              index === 0 ||
              disabled
            }
            onClick={onMoveUp}
            className="
              rounded-lg
              border
              border-gray-200
              bg-white
              p-2
              text-gray-600
              transition
              hover:bg-yellow-50
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            <ArrowUp size={17} />
          </button>

          {/* DÓŁ */}

          <button
            type="button"
            title="Przesuń w dół"
            disabled={
              index === total - 1 ||
              disabled
            }
            onClick={onMoveDown}
            className="
              rounded-lg
              border
              border-gray-200
              bg-white
              p-2
              text-gray-600
              transition
              hover:bg-yellow-50
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            <ArrowDown size={17} />
          </button>

          {/* ODEPNIJ */}

          <button
            type="button"
            title="Odepnij kierowcę"
            disabled={disabled}
            onClick={onRemove}
            className="
              rounded-lg
              border
              border-gray-200
              bg-white
              p-2
              text-gray-400
              transition
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-600
              disabled:opacity-30
            "
          >
            <X size={17} />
          </button>

        </div>

      </div>
    </div>
  );
}