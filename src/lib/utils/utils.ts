import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Fly and scale an element to a specified position. The element will scale down
 * to 0.85 of its original size and then scale back up to its original size as
 * it moves to the specified position.
 *
 * @param node The element to fly and scale.
 * @param params An object containing the following options:
 *  - duration: The duration of the animation in milliseconds. Defaults to 200.
 *  - x: The x-coordinate to fly to. Defaults to the element's current x-coordinate.
 *  - y: The y-coordinate to fly to. Defaults to the element's current y-coordinate.
 *  - start: The time at which the animation should start. Defaults to 0.
 * @returns An object containing the duration, delay, css, and start properties that
 * can be used to animate the element with the `web` animation library.
 */
export function flyAndScale(
  node: Element,
  params: {
    duration?: number;
    x?: number;
    y?: number;
    start?: number;
  } = {}
) {
  const style = getComputedStyle(node);
  const transform = style.transform === 'none' ? '' : style.transform;

  const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (style: Record<string, string | number>) => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, '');
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t: number) => {
      const scale = scaleConversion(t, [0, 1], [0.85, 1]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const y = scaleConversion(t, [0, 1], [params.y ?? 0, 0]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t
      });
    },
    start: params.start ?? 0
  };
}
