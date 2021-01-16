import React from 'react';
import { Transform } from '@dnd-kit/utilities';
import type { ViewRect, LayoutRect, Translate } from '../../types';
import { SensorDescriptor } from '../../sensors';
import { CollisionDetection } from '../../utilities';
import { Modifiers } from '../../modifiers';
import type { LayoutRectMap } from '../../store/types';
import type { UniqueIdentifier } from '../../types';
import { Announcements, ScreenReaderInstructions } from '../Accessibility';
interface Active {
    id: UniqueIdentifier;
}
export interface DragStartEvent {
    active: Active;
}
export interface DragMoveEvent {
    active: Active;
    delta: Translate;
    draggingRect: ViewRect;
    droppableRects: LayoutRectMap;
    over: {
        id: UniqueIdentifier;
        rect: LayoutRect;
    } | null;
}
export interface DragOverEvent {
    active: Active;
    draggingRect: ViewRect;
    droppableRects: LayoutRectMap;
    over: {
        id: UniqueIdentifier;
        rect: LayoutRect;
    } | null;
}
export interface DragEndEvent {
    active: Active;
    delta: Translate;
    over: {
        id: UniqueIdentifier;
    } | null;
}
export declare type DragCancelEvent = DragEndEvent;
interface Props {
    autoScroll?: boolean;
    announcements?: Announcements;
    children?: React.ReactNode;
    collisionDetection?: CollisionDetection;
    screenReaderInstructions?: ScreenReaderInstructions;
    sensors?: SensorDescriptor<any>[];
    modifiers?: Modifiers;
    onDragStart?(event: DragStartEvent): void;
    onDragMove?(event: DragMoveEvent): void;
    onDragOver?(event: DragOverEvent): void;
    onDragEnd?(event: DragEndEvent): void;
    onDragCancel?(event: DragCancelEvent): void;
}
export declare const ActiveDraggableContext: React.Context<Transform>;
export declare const DndContext: React.NamedExoticComponent<Props>;
export {};
