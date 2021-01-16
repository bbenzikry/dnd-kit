import { AbstractPointerSensor, PointerSensorOptions, PointerSensorProps } from '../pointer';
export interface MouseSensorOptions extends PointerSensorOptions {
}
export declare class MouseSensor extends AbstractPointerSensor {
    constructor(props: PointerSensorProps);
    static activators: {
        eventName: "onMouseDown";
        handler: ({ nativeEvent }: React.MouseEvent) => boolean;
    }[];
}
