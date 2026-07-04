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
				<h1>f-curve</h1>
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

			<CircleStage />

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
	</TweeqProvider>
</template>

<style scoped>
.app {
	max-width: 760px;
	margin: 0 auto;
	padding: 20px 20px 48px;
	display: flex;
	flex-direction: column;
	gap: var(--tq-gap-section, 16px);
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

.editors {
	display: flex;
	flex-direction: column;
	gap: var(--tq-gap-related, 8px);
}
</style>
