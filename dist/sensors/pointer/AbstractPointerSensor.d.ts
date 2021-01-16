import type { SensorInstance, SensorProps, SensorOptions } from '../types';
interface DistanceConstraint {
    distance: number;
}
interface DelayConstraint {
    delay: number;
    tolerance: number;
}
interface EventDescriptor {
    name: keyof DocumentEventMap;
    passive?: boolean;
}
export interface PointerEventHandlers {
    move: EventDescriptor;
    end: EventDescriptor;
}
export declare type PointerActivationConstraint = DistanceConstraint | DelayConstraint;
export interface PointerSensorOptions extends SensorOptions {
    activationConstraint?: PointerActivationConstraint;
}
export declare type PointerSensorProps = SensorProps<PointerSensorOptions>;
export declare class AbstractPointerSensor implements SensorInstance {
    private props;
    private events;
    autoScrollEnabled: boolean;
    private activated;
    private initialCoordinates;
    private timeoutId;
    private listeners;
    private ownerDocument;
    constructor(props: PointerSensorProps, events: PointerEventHandlers, listenerTarget?: Document | HTMLElement);
    private attach;
    private detach;
    private handleStart;
    private handleMove;
    private handleEnd;
    private handleCancel;
    private handleKeydown;
}
export {};
