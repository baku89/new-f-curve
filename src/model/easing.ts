import {ref, type Ref} from 'vue'

/**
 * The coupled derivative-chain views of a single 1-D motion over normalized
 * time t∈[0,1]:
 *
 *   pos   p(t)      — absolute parameter (0 at the left dot, 1 at the right dot)
 *   vel   p'(t)     — velocity
 *   acc   p''(t)    — acceleration
 *   jerk  p'''(t)   — jerk (rate of change of acceleration)
 *
 * Exactly one view is *authoritative* at a time (`level`, the one last drawn).
 * The others are re-derived from it by finite differencing (higher orders) and
 * integration (lower orders). Because differentiation amplifies noise and
 * integration smooths it, the editors have deliberately different "feel":
 * drawing jerk yields buttery position; drawing position yields jagged jerk
 * (hence the light smoothing on each differentiation).
 */

export type Level = 'pos' | 'vel' | 'acc' | 'jerk'
export const LEVELS: Level[] = ['pos', 'vel', 'acc', 'jerk']
const ORDER: Record<Level, number> = {pos: 0, vel: 1, acc: 2, jerk: 3}

/** Number of segments across t∈[0,1]. Samples = N + 1. */
export const N = 192
const DT = 1 / N

// ── numeric helpers ────────────────────────────────────────────────────────

/** Central-difference derivative (forward/backward at the ends). */
function derivative(f: number[]): number[] {
	const n = f.length
	const g = new Array<number>(n)
	for (let i = 0; i < n; i++) {
		if (i === 0) g[i] = (f[1] - f[0]) / DT
		else if (i === n - 1) g[i] = (f[n - 1] - f[n - 2]) / DT
		else g[i] = (f[i + 1] - f[i - 1]) / (2 * DT)
	}
	return g
}

/** Cumulative trapezoidal integral with initial value c0. */
function integrate(g: number[], c0: number): number[] {
	const n = g.length
	const f = new Array<number>(n)
	f[0] = c0
	for (let i = 1; i < n; i++) f[i] = f[i - 1] + ((g[i - 1] + g[i]) / 2) * DT
	return f
}

/** Definite integral ∫₀¹ g dt (trapezoidal). */
function integral(g: number[]): number {
	let s = 0
	for (let i = 1; i < g.length; i++) s += ((g[i - 1] + g[i]) / 2) * DT
	return s
}

/** [1 2 1]/4 smoothing, `passes` times (endpoints preserved). */
function smooth(f: number[], passes = 1): number[] {
	let a = f.slice()
	for (let p = 0; p < passes; p++) {
		const b = a.slice()
		for (let i = 1; i < a.length - 1; i++) {
			b[i] = (a[i - 1] + 2 * a[i] + a[i + 1]) / 4
		}
		a = b
	}
	return a
}

/** Linear-interpolated sample of an [0..N] array at phase∈[0,1]. */
export function sampleAt(arr: number[], phase: number): number {
	const x = Math.min(Math.max(phase, 0), 1) * N
	const i = Math.floor(x)
	if (i >= N) return arr[N]
	const u = x - i
	return arr[i] * (1 - u) + arr[i + 1] * u
}

// ── model ──────────────────────────────────────────────────────────────────

export interface EasingModel {
	level: Ref<Level>
	pos: Ref<number[]>
	vel: Ref<number[]>
	acc: Ref<number[]>
	jerk: Ref<number[]>
	/** True between beginDraw()/endDraw() — editors freeze their y-scale while set. */
	drawing: Ref<boolean>
	get(level: Level): number[]
	beginDraw(level: Level): void
	paint(t0: number, y0: number, t1: number, y1: number): void
	endDraw(): void
	reset(): void
}

function smoothstep(): number[] {
	// p(t) = 3t² − 2t³ : the canonical ease-in-ease-out, rest at both ends.
	return Array.from({length: N + 1}, (_, i) => {
		const t = i / N
		return 3 * t * t - 2 * t * t * t
	})
}

/**
 * Rebuild all four orders from the authoritative `src` at `level`.
 * Higher orders differentiate; lower orders integrate (constants 0), then a
 * single velocity offset v0 is applied so the circle always lands: pos(1)=1.
 * Adding a constant to velocity leaves every ∫(order) untouched, so the
 * per-graph area=1 rule set in endDraw() is preserved.
 */
function deriveAll(level: Level, src: number[]) {
	const k = ORDER[level]
	const a: number[][] = [[], [], [], []]
	a[k] = src.slice()
	if (k === 0) {
		a[0][0] = 0
		a[0][N] = 1 // position is pinned to the two dots by construction
	}
	for (let o = k + 1; o <= 3; o++) a[o] = smooth(derivative(a[o - 1]), 1)
	for (let o = k - 1; o >= 0; o--) a[o] = integrate(a[o + 1], 0)
	if (k >= 1) {
		const v0 = 1 - a[0][N]
		for (let i = 0; i <= N; i++) {
			a[1][i] += v0
			a[0][i] += v0 * (i * DT)
		}
	}
	return {pos: a[0], vel: a[1], acc: a[2], jerk: a[3]}
}

export function createEasingModel(): EasingModel {
	const level = ref<Level>('pos')
	const pos = ref<number[]>([])
	const vel = ref<number[]>([])
	const acc = ref<number[]>([])
	const jerk = ref<number[]>([])
	const drawing = ref(false)

	// Authoritative sample array — always corresponds to `level.value`.
	let src: number[] = []

	function recompute() {
		const r = deriveAll(level.value, src)
		pos.value = r.pos
		vel.value = r.vel
		acc.value = r.acc
		jerk.value = r.jerk
	}

	function get(l: Level): number[] {
		return l === 'pos'
			? pos.value
			: l === 'vel'
				? vel.value
				: l === 'acc'
					? acc.value
					: jerk.value
	}

	function beginDraw(l: Level) {
		drawing.value = true
		level.value = l
		src = get(l).slice()
	}

	function paint(t0: number, y0: number, t1: number, y1: number) {
		const i0 = Math.min(Math.max(Math.round(t0 * N), 0), N)
		const i1 = Math.min(Math.max(Math.round(t1 * N), 0), N)
		const lo = Math.min(i0, i1)
		const hi = Math.max(i0, i1)
		for (let i = lo; i <= hi; i++) {
			const u = i1 === i0 ? 0 : (i - i0) / (i1 - i0)
			src[i] = y0 + (y1 - y0) * u
		}
		if (level.value === 'pos') {
			src[0] = 0
			src[N] = 1
		}
		recompute()
	}

	function endDraw() {
		// Ended before the rescale below, so the range-fit watchers refit once here.
		drawing.value = false
		// On release, scale the drawn graph so its own area = 1 (per spec).
		// pos is pinned instead, so it is left untouched.
		if (level.value !== 'pos') {
			const area = integral(src)
			if (Math.abs(area) > 1e-4) {
				for (let i = 0; i <= N; i++) src[i] /= area
			}
		}
		recompute()
	}

	function reset() {
		level.value = 'pos'
		src = smoothstep()
		recompute()
	}

	reset()

	return {level, pos, vel, acc, jerk, drawing, get, beginDraw, paint, endDraw, reset}
}
