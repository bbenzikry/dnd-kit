/// <reference types="react" />
import { Transform } from '@dnd-kit/utilities';
import { SyntheticListenerMap } from './utilities';
export interface UseDraggableArguments {
    id: string;
    disabled?: boolean;
    attributes?: {
        role?: string;
        roleDescription?: string;
        tabIndex?: number;
    };
}
export declare type DraggableSyntheticListeners = SyntheticListenerMap | undefined;
export declare function useDraggable({ id, disabled, attributes, }: UseDraggableArguments): {
    active: string | null;
    activeNodeRect: import("..").ViewRect | null;
    activatorEvent: Event | null;
    attributes: {
        role: string;
        tabIndex: number;
        'aria-pressed': boolean | undefined;
        'aria-roledescription': string;
        'aria-describedby': string;
    };
    droppableRects: import("../store").LayoutRectMap;
    isDragging: boolean;
    listeners: DraggableSyntheticListeners;
    node: import("react").MutableRefObject<HTMLElement | null>;
    over: {
        id: string;
        rect: import("..").LayoutRect;
    } | null;
    setNodeRef: (element: HTMLElement | null) => void;
    transform: Transform | null;
};
