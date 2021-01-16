/// <reference types="react" />
import { Data } from '../store';
import type { LayoutRect } from '../types';
export interface UseDroppableArguments {
    id: string;
    disabled?: boolean;
    data?: Data;
}
export declare function useDroppable({ data, disabled, id, }: UseDroppableArguments): {
    rect: import("react").MutableRefObject<LayoutRect | null>;
    isOver: boolean;
    node: import("react").MutableRefObject<HTMLElement | null>;
    over: {
        id: string;
        rect: LayoutRect;
    } | null;
    setNodeRef: (element: HTMLElement | null) => void;
};
