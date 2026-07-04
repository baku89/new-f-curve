import type {InjectionKey} from 'vue'

import type {Playback} from './composables/usePlayback'
import type {EasingModel} from './model/easing'

export const ModelKey: InjectionKey<EasingModel> = Symbol('easing-model')
export const PlaybackKey: InjectionKey<Playback> = Symbol('playback')
