<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {
	initTweeq,
	InputButton,
	InputButtonToggle,
	InputNumber,
	TweeqProvider,
} from 'tweeq'
import {provide} from 'vue'

import CircleStage from './components/CircleStage.vue'
import CurveEditor from './components/CurveEditor.vue'
import {usePlayback} from './composables/usePlayback'
import {ModelKey, PlaybackKey} from './keys'
import {createEasingModel} from './model/easing'

initTweeq('com.baku89.f-curve', {
	colorMode: 'dark',
	accentColor: '#a2f517',
	grayColor: '#6672c3',
	backgroundColor: '#111111',
})

const model = createEasingModel()
const playback = usePlayback(2000)

provide(ModelKey, model)
provide(PlaybackKey, playback)

const {playing, duration, toggle} = playback

// Space toggles play/pause (unless typing in an input or on a focused button).
useEventListener(window, 'keydown', (e: KeyboardEvent) => {
	if (e.code !== 'Space') return
	const el = e.target as HTMLElement | null
	const tag = el?.tagName
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || el?.isContentEditable) {
		return
	}
	e.preventDefault()
	toggle()
})
</script>

<template>
	<TweeqProvider>
		<div class="app">
			<header class="head">
				<h1>New F-Curve</h1>
				<div class="transport">
					<InputNumber
						v-model="duration"
						:min="200"
						:max="8000"
						:precision="0"
						:bar="0"
						suffix=" ms"
						style="width: 6rem"
					/>
					<InputButtonToggle
						v-model="playing"
						:icon="
							playing
								? 'material-symbols:pause-rounded'
								: 'material-symbols:play-arrow-rounded'
						"
					/>
					<InputButton
						icon="material-symbols:replay-rounded"
						label="Reset"
						subtle
						@click="model.reset()"
					/>
				</div>
			</header>

			<div class="body">
				<div class="preview">
					<CircleStage />
				</div>

				<div class="editors">
					<CurveEditor
						level="pos"
						title="Position"
						color="var(--tq-color-accent, #a2f517)"
					/>
					<CurveEditor
						level="vel"
						title="Velocity"
						color="var(--tq-color-info, #3e63dd)"
					/>
					<CurveEditor
						level="acc"
						title="Acceleration"
						color="var(--tq-color-warning, #ffc53d)"
					/>
					<CurveEditor
						level="jerk"
						title="Jerk"
						color="var(--tq-color-error, #e5484d)"
					/>
				</div>
			</div>
		</div>
	</TweeqProvider>
</template>

<style scoped>
.app {
	box-sizing: border-box;
	max-width: 1280px;
	/* Cap to the viewport so the graphs are forced to shrink to fit rather
	   than growing the page (min-height would let them overflow). */
	height: 100dvh;
	margin: 0 auto;
	padding: 18px 22px 22px;
	display: flex;
	flex-direction: column;
	gap: var(--tq-gap-section, 16px);
	overflow: hidden;
}

.head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
}

h1 {
	margin: 0;
	font-family: var(--tq-font-heading, sans-serif);
	font-size: 20px;
	font-weight: 600;
	letter-spacing: 0.02em;
}

.transport {
	display: flex;
	align-items: center;
	gap: var(--tq-gap-related, 6px);
}

/* Landscape: animation preview on the left, the four graphs stacked on the
   right, together filling the viewport for a 16:9-friendly composition. */
.body {
	flex: 1;
	min-height: 0;
	display: flex;
	gap: 22px;
	align-items: stretch;
}

.preview {
	flex: 1 1 46%;
	min-width: 0;
	display: flex;
	align-items: stretch;
	justify-content: center;
}

.editors {
	flex: 1 1 54%;
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
	gap: var(--tq-gap-related, 8px);
}

@media (max-width: 760px) {
	.app {
		height: auto;
		overflow: visible;
	}

	.body {
		flex-direction: column;
	}

	.editors .editor {
		min-height: 128px;
	}
}
</style>
