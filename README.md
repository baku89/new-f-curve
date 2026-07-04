# f-curve

A minimal, direct-manipulation easing editor. A filled dot travels left → right
over a fixed duration; you shape the motion by **drawing** — not with Bézier
handles — any of four coupled derivative-chain graphs:

- **Position** `p(t)`
- **Velocity** `p'(t)`
- **Acceleration** `p''(t)`
- **Jerk** `p'''(t)`

Draw in any one graph and the others are re-derived live (finite differencing /
integration). On release, velocity/acceleration/jerk are area-normalised so the
dot always lands on the target. Playback loops continuously and pauses only
while you're drawing.

Built with Vite + Vue 3 and [Tweeq](https://github.com/baku89/tweeq).

## Develop

Tweeq is vendored as a git submodule and consumed as source.

```sh
git clone --recurse-submodules https://github.com/baku89/new-f-curve
cd new-f-curve
yarn install
yarn dev
```

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via GitHub Actions.
