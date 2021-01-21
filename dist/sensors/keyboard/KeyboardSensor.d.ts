import type { SensorInstance, SensorProps, SensorOptions } from '../types';
import { KeyboardCoordinateGetter, KeyboardCodes } from './types';
export interface KeyboardSensorOptions extends SensorOptions {
    keyboardCodes?: KeyboardCodes;
    coordinateGetter?: KeyboardCoordinateGetter;
    scrollBehavior?: ScrollBehavior;
}
export declare type KeyboardSensorProps = SensorProps<KeyboardSensorOptions>;
export declare class KeyboardSensor implements SensorInstance {
    private props;
    autoScrollEnabled: boolean;
    private coordinates;
    private listeners;
    constructor(props: KeyboardSensorProps);
    private attach;
    private handleStart;
    private handleKeyDown;
    private handleMove;
    private handleEnd;
    private handleCancel;
    private detach;
    static activators: {
        eventName: "onKeyDown";
        handler: (event: React.KeyboardEvent, { keyboardCodes }: KeyboardSensorOptions) => boolean;
    }[];
}
