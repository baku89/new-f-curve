<script setup lang="ts">
import {scalar} from 'linearly'
import {computed, inject} from 'vue'

import {ModelKey, PlaybackKey} from '../keys'
import {sampleAt} from '../model/easing'

const model = inject(ModelKey)!
const playback = inject(PlaybackKey)!

const LEFT = 130
const RIGHT = 870
const CY = 85
const R = 30

// pos is pinned to [0,1] at the ends but can overshoot in between / at release,
// so the moving dot may briefly travel past a target — that's the overshoot cue.
const cx = computed(() =>
	scalar.lerp(LEFT, RIGHT, sampleAt(model.pos.value, playback.phase.value))
)
</script>

<template>
	<svg class="stage" viewBox="0 0 1000 170" preserveAspectRatio="xMidYMid meet">
		<line class="track" :x1="LEFT" :y1="CY" :x2="RIGHT" :y2="CY" />
		<circle class="target" :cx="LEFT" :cy="CY" :r="R" />
		<circle class="target" :cx="RIGHT" :cy="CY" :r="R" />
		<circle class="ball" :cx="cx" :cy="CY" :r="R - 4" />
	</svg>
</template>

<style scoped>
.stage {
	width: 100%;
	height: 120px;
	display: block;
	overflow: visible;
}

.track {
	stroke: var(--tq-color-border, rgba(255, 255, 255, 0.14));
	stroke-width: 2;
}

.target {
	fill: none;
	stroke: var(--tq-color-border, rgba(255, 255, 255, 0.32));
	stroke-width: 2.5;
	stroke-dasharray: 5 7;
}

.ball {
	fill: var(--tq-color-accent, #4c8dff);
}
</style>
