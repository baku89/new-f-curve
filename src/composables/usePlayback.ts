import {useRafFn} from '@vueuse/core'
import {ref} from 'vue'

/**
 * A looping transport. `phase` cycles 0→1 over `duration` ms and wraps.
 * Playback holds still while any editor is being dragged (`beginScrub`/
 * `endScrub`), independent of the user's explicit play/pause.
 */
export function usePlayback(durationMs = 2000) {
	const phase = ref(0)
	const playing = ref(true)
	const duration = ref(durationMs)

	// >0 while one or more editors are mid-stroke.
	let scrubbers = 0

	useRafFn(({delta}) => {
		if (!playing.value || scrubbers > 0) return
		let p = phase.value + delta / duration.value
		p -= Math.floor(p) // wrap into [0,1)
		phase.value = p
	})

	function toggle() {
		playing.value = !playing.value
	}
	function beginScrub() {
		scrubbers++
	}
	function endScrub() {
		scrubbers = Math.max(0, scrubbers - 1)
	}

	return {phase, playing, duration, toggle, beginScrub, endScrub}
}

export type Playback = ReturnType<typeof usePlayback>
