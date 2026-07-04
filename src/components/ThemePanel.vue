<script setup lang="ts">
/**
 * TEMPORARY debug panel — tweak tweeq's theme (accent / gray / background /
 * mode) live, then Copy the JSON and paste it into initTweeq() in App.vue to
 * persist. Delete this component (and its <ThemePanel/> in App.vue) when done.
 */
import {InputButton, InputButtonToggle, InputColor, useTweeq} from 'tweeq'
import {computed, ref} from 'vue'

const {theme} = useTweeq()

const dark = computed({
	get: () => theme.colorMode === 'dark',
	set: v => (theme.colorMode = v ? 'dark' : 'light'),
})

// Shaped exactly like initTweeq()'s options object, ready to paste back.
const json = computed(() =>
	JSON.stringify(
		{
			colorMode: theme.colorMode,
			accentColor: theme.accentColor,
			grayColor: theme.grayColor,
			backgroundColor: theme.backgroundColor,
		},
		null,
		'\t'
	)
)

const copied = ref(false)
async function copy() {
	try {
		await navigator.clipboard.writeText(json.value)
		copied.value = true
		setTimeout(() => (copied.value = false), 1200)
	} catch {
		// clipboard may be blocked; the JSON is visible to select manually
	}
}
</script>

<template>
	<section class="panel">
		<header class="head">
			<span class="title">Theme · debug</span>
			<InputButtonToggle
				v-model="dark"
				:icon="dark ? 'material-symbols:dark-mode' : 'material-symbols:light-mode'"
				:label="dark ? 'Dark' : 'Light'"
			/>
		</header>

		<div class="grid">
			<label>Accent</label>
			<InputColor v-model="theme.accentColor" />
			<label>Gray</label>
			<InputColor v-model="theme.grayColor" />
			<label>Background</label>
			<InputColor v-model="theme.backgroundColor" />
		</div>

		<div class="export">
			<pre>{{ json }}</pre>
			<InputButton
				:icon="
					copied
						? 'material-symbols:check-rounded'
						: 'material-symbols:content-copy-outline-rounded'
				"
				:label="copied ? 'Copied' : 'Copy JSON'"
				subtle
				@click="copy"
			/>
		</div>
	</section>
</template>

<style scoped>
.panel {
	border: 1px dashed var(--tq-color-border, rgba(255, 255, 255, 0.2));
	border-radius: var(--tq-radius-pane, 8px);
	background: var(--tq-color-surface, rgba(255, 255, 255, 0.04));
	padding: 10px 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.title {
	font-weight: 600;
	font-size: 11px;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--tq-color-text-mute, rgba(255, 255, 255, 0.5));
}

.grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 6px 12px;
	align-items: center;
	max-width: 320px;
}

.grid label {
	color: var(--tq-color-text-mute, rgba(255, 255, 255, 0.55));
}

.export {
	display: flex;
	align-items: flex-start;
	gap: 10px;
}

.export pre {
	flex: 1;
	margin: 0;
	font-family: var(--tq-font-code, ui-monospace, monospace);
	font-size: 11px;
	color: var(--tq-color-text-mute, rgba(255, 255, 255, 0.6));
	background: var(--tq-color-input, rgba(0, 0, 0, 0.22));
	border-radius: var(--tq-radius-input, 4px);
	padding: 8px 10px;
	white-space: pre;
	overflow-x: auto;
}
</style>
