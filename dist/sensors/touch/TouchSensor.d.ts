import React from 'react';
import { AbstractPointerSensor, PointerSensorProps, PointerSensorOptions } from '../pointer';
export interface TouchSensorOptions extends PointerSensorOptions {
}
export declare class TouchSensor extends AbstractPointerSensor {
    constructor(props: PointerSensorProps);
    static activators: {
        eventName: "onTouchStart";
        handler: ({ nativeEvent }: React.TouchEvent) => boolean;
    }[];
}
