import { useRef, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

const DRAG_SENSITIVITY = 0.42;
const KEY_STEP = 2;

function ReverbKnob({ onAmountChange, onPrepareAudio }) {
  const reverbAmount = useSettingsStore((state) => state.reverbAmount);
  const dragRef = useRef(null);
  const liveAmountRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAmount, setDragAmount] = useState(null);

  const displayedAmount = dragAmount ?? reverbAmount;
  const knobAngle = -135 + displayedAmount * 2.7;

  const emitAmount = (amount, live) => {
    const clamped = Math.min(100, Math.max(0, amount));
    onAmountChange?.(clamped, { live });
    return clamped;
  };

  const updateFromDrag = (clientY, sensitivity = DRAG_SENSITIVITY) => {
    if (!dragRef.current) {
      return;
    }

    const deltaY = dragRef.current.startY - clientY;
    const nextAmount = emitAmount(
      dragRef.current.startValue + deltaY * sensitivity,
      true,
    );
    liveAmountRef.current = nextAmount;
    setDragAmount(nextAmount);
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startY: event.clientY,
      startValue: dragAmount ?? reverbAmount,
    };
    setIsDragging(true);
    void onPrepareAudio?.();
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) {
      return;
    }

    const sensitivity = event.shiftKey ? DRAG_SENSITIVITY * 0.25 : DRAG_SENSITIVITY;
    updateFromDrag(event.clientY, sensitivity);
  };

  const finishDrag = (event) => {
    if (!dragRef.current) {
      return;
    }

    const finalAmount = liveAmountRef.current ?? dragRef.current.startValue;
    dragRef.current = null;
    liveAmountRef.current = null;
    setIsDragging(false);
    setDragAmount(null);
    emitAmount(finalAmount, false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      void onPrepareAudio?.();
      emitAmount(reverbAmount + KEY_STEP, false);
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      void onPrepareAudio?.();
      emitAmount(reverbAmount - KEY_STEP, false);
    }
  };

  return (
    <button
      aria-label="Reverb size and mix"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(displayedAmount)}
      className={`reverb-knob${isDragging ? ' is-dragging' : ''}`}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      role="slider"
      style={{ '--knob-angle': `${knobAngle}deg` }}
      title="Reverb"
      type="button"
    />
  );
}

export default ReverbKnob;
