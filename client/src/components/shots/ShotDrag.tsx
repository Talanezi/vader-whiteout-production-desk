import {
  PointerSensor,
  KeyboardSensor,
  PointerActivationConstraints,
} from '@dnd-kit/dom'
/** Handle-only activation. Touch can scroll outside the grip; short taps never lift. */
export const shotSensors = [
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === 'touch'
        ? [new PointerActivationConstraints.Delay({ value: 180, tolerance: 6 })]
        : [new PointerActivationConstraints.Distance({ value: 6 })],
  }),
  KeyboardSensor,
]
