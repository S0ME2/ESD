import {createContext} from 'react';
import type {Frame} from '../course/types';
export const FramePlayback=createContext<{frame:Frame;progress:number}|null>(null);
