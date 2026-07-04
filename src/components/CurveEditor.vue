<script setup lang="ts">
import {scalar} from 'linearly'
import {computed, inject, ref, watch} from 'vue'

import {ModelKey, PlaybackKey} from '../keys'
import {type Level, N, sampleAt} from '../model/easing'

const props = defineProps<{level: Level; title: string; color: string}>()

const model = inject(ModelKey)!
const playback = inject(PlaybackKey)!

// Internal coordinate system; the SVG stretches to fit (non-uniform), and every
// stroke uses vector-effect:non-scaling-stroke so widths stay constant.
const VBW = 1000
const VBH = 300

const data = computed<number[]>(() => {
	switch (props.level) {
		case 'pos':
			return model.pos.value
		case 'vel':
			return model.vel.value
		case 'acc':
			return model.acc.value
		default:
			return model.jerk.value
	}
})

const active = computed(() => model.level.value === props.level)

// ── vertical range (frozen while dragging so the curve doesn't jump) ─────────
const range = ref<[number, number]>([0, 1])

function fit(arr: number[]): [number, number] {
	let mn = Infinity
	let mx = -Infinity
	for (const v of arr) {
		if (v < mn) mn = v
		if (v > mx) mx = v
	}
	if (props.level === 'pos') {
		mn = Math.min(mn, 0)
		mx = Math.max(mx, 1)
		const pad = (mx - mn) * 0.18 || 0.1
		return [mn - pad, mx + pad]
	}
	// signed quantities look best symmetric about the zero line
	const r = Math.max(Math.abs(mn), Math.abs(mx), 1e-3) * 1.25
	return [-r, r]
}

let dragging = false
// Refit the y-scale only when nothing is being drawn — a stroke on any editor
// (this one or another) freezes every graph's scale so it doesn't jump mid-drag.
watch(
	data,
	d => {
		if (!model.drawing.value) range.value = fit(d)
	},
	{immediate: true}
)

// ── mapping ──────────────────────────────────────────────────────────────
function xOf(i: number) {
	return (i / N) * VBW
}
function yOf(v: number) {
	const [lo, hi] = range.value
	return (1 - (v - lo) / (hi - lo)) * VBH
}

const points = computed(() =>
	data.value.map((v, i) => `${xOf(i).toFixed(2)},${yOf(v).toFixed(2)}`).join(' ')
)

const areaPath = computed(() => {
	const y0 = yOf(0)
	const pts = data.value.map(
		(v, i) => `${xOf(i).toFixed(2)},${yOf(v).toFixed(2)}`
	)
	return `M ${xOf(0).toFixed(2)},${y0.toFixed(2)} L ${pts.join(' L ')} L ${xOf(N).toFixed(2)},${y0.toFixed(2)} Z`
})

const zeroY = computed(() => yOf(0))
const oneY = computed(() => yOf(1))
const showZero = computed(() => {
	const [lo, hi] = range.value
	return lo < 0 && hi > 0
})
const showOne = computed(() => props.level === 'pos')

const playheadX = computed(() => playback.phase.value * VBW)
const curVal = computed(() => sampleAt(data.value, playback.phase.value))
const curY = computed(() => yOf(curVal.value))

// ── drawing ──────────────────────────────────────────────────────────────
const svg = ref<SVGSVGElement | null>(null)
let last = {t: 0, v: 0}

function evToTV(e: PointerEvent) {
	const rect = svg.value!.getBoundingClientRect()
	const t = scalar.clamp((e.clientX - rect.left) / rect.width, 0, 1)
	const py = (e.clientY - rect.top) / rect.height
	const [lo, hi] = range.value
	const v = lo + (1 - py) * (hi - lo)
	return {t, v}
}

function onDown(e: PointerEvent) {
	svg.value!.setPointerCapture(e.pointerId)
	dragging = true
	playback.beginScrub()
	model.beginDraw(props.level)
	last = evToTV(e)
	model.paint(last.t, last.v, last.t, last.v)
}

// Light pointer smoothing: 1 = raw, →0 = heavy. "Just a little" easing so the
// hand-drawn curve isn't jittery (and its derivatives aren't spiky).
const SMOOTH = 0.5
function onMove(e: PointerEvent) {
	if (!dragging) return
	const p = evToTV(e)
	const v = last.v + (p.v - last.v) * SMOOTH
	model.paint(last.t, last.v, p.t, v)
	last = {t: p.t, v}
}

function onUp(e: PointerEvent) {
	if (!dragging) return
	dragging = false
	svg.value!.releasePointerCapture(e.pointerId)
	model.endDraw()
	playback.endScrub()
	range.value = fit(data.value)
}
</script>

<template>
	<div class="editor" :class="{active}">
		<div class="bar">
			<span class="title" :style="{color}">{{ title }}</span>
			<span class="val">{{ curVal.toFixed(3) }}</span>
		</div>
		<svg
			ref="svg"
			class="graph"
			:viewBox="`0 0 ${VBW} ${VBH}`"
			preserveAspectRatio="none"
			@pointerdown="onDown"
			@pointermove="onMove"
			@pointerup="onUp"
			@pointercancel="onUp"
		>
			<line
				v-if="showZero"
				class="guide"
				x1="0"
				:y1="zeroY"
				:x2="VBW"
				:y2="zeroY"
			/>
			<line
				v-if="showOne"
				class="guide target"
				x1="0"
				:y1="oneY"
				:x2="VBW"
				:y2="oneY"
			/>
			<path class="area" :style="{fill: color}" :d="areaPath" />
			<polyline class="curve" :style="{stroke: color}" :points="points" />
			<line class="playhead" :x1="playheadX" y1="0" :x2="playheadX" :y2="VBH" />
			<circle class="cursor" :style="{fill: color}" :cx="playheadX" :cy="curY" />
		</svg>
	</div>
</template>

<style scoped>
.editor {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	border: 1px solid var(--tq-color-border-subtle, rgba(255, 255, 255, 0.08));
	border-radius: var(--tq-radius-input, 4px);
	background: var(--tq-color-surface, rgba(255, 255, 255, 0.04));
	overflow: hidden;
}

.editor.active {
	border-color: var(--tq-color-accent, #4c8dff);
}

.bar {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	padding: 6px 10px 2px;
}

.title {
	font-weight: 600;
	letter-spacing: 0.04em;
}

.val {
	font-family: var(--tq-font-numeric, ui-monospace, monospace);
	font-variant-numeric: tabular-nums;
	color: var(--tq-color-text-mute, rgba(255, 255, 255, 0.5));
}

.graph {
	width: 100%;
	flex: 1;
	min-height: 0;
	display: block;
	touch-action: none;
	user-select: none;
	cursor: crosshair;
}

.guide {
	stroke: var(--tq-color-border, rgba(255, 255, 255, 0.16));
	stroke-width: 1;
	vector-effect: non-scaling-stroke;
}

.guide.target {
	stroke-dasharray: 3 5;
}

.area {
	fill-opacity: 0.13;
}

.curve {
	fill: none;
	stroke-width: 2;
	stroke-linejoin: round;
	vector-effect: non-scaling-stroke;
}

.playhead {
	stroke: var(--tq-color-text, #e7e7ea);
	stroke-width: 1;
	opacity: 0.45;
	vector-effect: non-scaling-stroke;
}

.cursor {
	r: 3.5;
}
</style>
