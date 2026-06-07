"use client";

import { useCallback, useRef, useState } from "react";

const DELETE_ACTION_WIDTH = 80;
const OPEN_THRESHOLD = 40;

type SwipeableListRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  isDeleting?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SwipeableListRow({
  children,
  onDelete,
  isDeleting = false,
  isOpen,
  onOpenChange,
}: SwipeableListRowProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);

  const offset = isOpen ? -DELETE_ACTION_WIDTH : dragOffset;

  const clampOffset = useCallback((value: number) => {
    return Math.max(-DELETE_ACTION_WIDTH, Math.min(0, value));
  }, []);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (isDeleting) return;
      startXRef.current = event.touches[0].clientX;
      startOffsetRef.current = isOpen ? -DELETE_ACTION_WIDTH : 0;
      setIsDragging(true);
    },
    [isDeleting, isOpen],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!isDragging || isDeleting) return;
      let deltaX = event.touches[0].clientX - startXRef.current;
      if (!isOpen && deltaX > 0) {
        deltaX = -deltaX;
      }
      setDragOffset(clampOffset(startOffsetRef.current + deltaX));
    },
    [clampOffset, isDeleting, isDragging, isOpen],
  );

  const finishDrag = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const shouldOpen = dragOffset <= -OPEN_THRESHOLD;
    onOpenChange(shouldOpen);
    setDragOffset(0);
  }, [dragOffset, isDragging, onOpenChange]);

  const handleTouchEnd = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const handleTouchCancel = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const handleDeleteClick = useCallback(() => {
    onDelete();
    onOpenChange(false);
  }, [onDelete, onOpenChange]);

  return (
    <li className="relative overflow-hidden bg-white">
      <div
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-red-500"
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="h-full w-full text-sm font-medium text-white disabled:opacity-60"
        >
          {isDeleting ? "…" : "削除"}
        </button>
      </div>

      <div
        className={`relative flex items-stretch bg-white ${
          isDragging ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {children}
      </div>
    </li>
  );
}
