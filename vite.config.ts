import vue from '@vitejs/plugin-vue'
import {fileURLToPath} from 'url'
import {defineConfig} from 'vite'
import glsl from 'vite-plugin-glsl'
import monacoEditorPlugin, {
	type IMonacoEditorOpts,
} from 'vite-plugin-monaco-editor'

// vite-plugin-monaco-editor ships its callable as `.default` under ESM.
const monacoEditorPluginDefault = (monacoEditorPlugin as any).default as (
	options: IMonacoEditorOpts
) => any

// tweeq is consumed as live source via a git submodule (dev_modules/tweeq),
// aliased below — same pattern as github.com/baku89/koma.
export default defineConfig({
	base: './',
	server: {port: 5173},
	plugins: [
		glsl(),
		vue(),
		// tweeq's barrel pulls in monaco (InputCode); wire its workers.
		monacoEditorPluginDefault({
			languageWorkers: ['editorWorkerService', 'typescript', 'json'],
		}),
	],
	resolve: {
		// Keep a single copy of the instance-sensitive libs so tweeq (aliased
		// source) and this app share the same Vue reactivity / Pinia registry.
		dedupe: ['vue', 'pinia', '@vueuse/core'],
		alias: [
			{
				find: '@',
				replacement: fileURLToPath(new URL('./src', import.meta.url)),
			},
			{
				find: 'tweeq',
				replacement: fileURLToPath(
					new URL('./dev_modules/tweeq/src', import.meta.url)
				),
			},
		],
	},
	define: {
		// tweeq's p-queue dependency probes this at import time.
		'process.env.PROMISE_QUEUE_COVERAGE': false,
	},
})
