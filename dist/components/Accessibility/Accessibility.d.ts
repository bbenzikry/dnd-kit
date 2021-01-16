import React from 'react';
import { Announcements, ScreenReaderInstructions } from './types';
import { UniqueIdentifier } from '../../types';
import { State } from '../../store';
interface Props {
    announcements?: Announcements;
    activeId: UniqueIdentifier | null;
    overId: UniqueIdentifier | null;
    lastEvent: State['draggable']['lastEvent'];
    screenReaderInstructions: ScreenReaderInstructions;
    hiddenTextDescribedById: UniqueIdentifier;
}
export declare function Accessibility({ announcements, activeId, overId, lastEvent, hiddenTextDescribedById, screenReaderInstructions, }: Props): React.ReactPortal | null;
export {};
