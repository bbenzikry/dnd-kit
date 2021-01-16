import type { ViewRect } from '../../types';
interface Arguments {
    disabled: boolean;
    draggingRect: ViewRect | null;
    interval?: number;
    scrollableAncestors: Element[];
    scrollableAncestorRects: ViewRect[];
}
export declare function useAutoScroller({ disabled, draggingRect, interval, scrollableAncestors, scrollableAncestorRects, }: Arguments): void;
export {};
