# Changelog

## 0.1.0 (2026-09-08)

### Features

- **a11y:** keyboard plate, spoken summary, reduced motion, and contrast ([#18](https://github.com/sean-reid/time/issues/18)) ([a8d6f73](https://github.com/sean-reid/time/commit/a8d6f7312a15929708bafe247828828f232d7a85))
- **catalogue:** add cited bodies from the Sun to M87* ([#9](https://github.com/sean-reid/time/issues/9)) ([d785dab](https://github.com/sean-reid/time/commit/d785dab902296d144d5d663e74b8c879d91ae7a5))
- **catalogue:** companions on cited Kepler orbits for every scene ([#20](https://github.com/sean-reid/time/issues/20)) ([f9d553c](https://github.com/sean-reid/time/commit/f9d553c500c42e7d7cca2b82a2a976c20bbe0194))
- free flight with kicks, real geodesics, and companions on Kepler orbits ([#21](https://github.com/sean-reid/time/issues/21)) ([8a9dd7f](https://github.com/sean-reid/time/commit/8a9dd7f693591191c2b924fcae52358d95dddd8c))
- **how:** explain the clocks, the frame, and the landmarks ([#10](https://github.com/sean-reid/time/issues/10)) ([3018993](https://github.com/sean-reid/time/commit/3018993645ae0816719f484f11c25f6f49474e29))
- live scene with a metric-stretched plate, per-body defaults, and shareable links ([#11](https://github.com/sean-reid/time/issues/11)) ([b931996](https://github.com/sean-reid/time/commit/b9319967595c733c87cf1738e6461c997d564c6d))
- **og:** render shared scenes as preview cards ([#16](https://github.com/sean-reid/time/issues/16)) ([9ba3490](https://github.com/sean-reid/time/commit/9ba34908f7a668c68832fb8fd044ebef37e80837))
- **physics:** Schwarzschild and Kerr clock rates with a course integrator ([#8](https://github.com/sean-reid/time/issues/8)) ([2d8f18b](https://github.com/sean-reid/time/commit/2d8f18b0ad52f91c941da0322b1fb01c8fc631fa))
- plot courses by tapping, dragging, or keyboard, with a timeline scrubber ([#12](https://github.com/sean-reid/time/issues/12)) ([d73ae2e](https://github.com/sean-reid/time/commit/d73ae2e7f627da9b324feb7db89b81fd9322df95))
- sim screen prototype with live clocks and an Earth plate ([1e92302](https://github.com/sean-reid/time/commit/1e9230237f976bb5654a75e83670803f3d0fbe71))
- **sound:** hear both clocks tick, off until tapped ([#15](https://github.com/sean-reid/time/issues/15)) ([67ccc08](https://github.com/sean-reid/time/commit/67ccc08afd81f9a05df051d1528ce8216407d9c6))
- **tours:** four guided flights with live captions and a tour player ([#13](https://github.com/sean-reid/time/issues/13)) ([de122a7](https://github.com/sean-reid/time/commit/de122a7a2fe922d8153fce1fe926d860a6fd062d))

### Bug Fixes

- audit quick wins across physics, links, plate, and readouts ([#23](https://github.com/sean-reid/time/issues/23)) ([ae3caba](https://github.com/sean-reid/time/commit/ae3caba42e9e17c2141c6ec0af93f0f26fae8394))
- **plate:** draw the trail from every sample instead of every Nth ([#25](https://github.com/sean-reid/time/issues/25)) ([314ce23](https://github.com/sean-reid/time/commit/314ce230fed763de47c51b1a941d1b6445ce04a4))
- redraw the flown path, keep the strip in its column, one list control for start orbits ([#22](https://github.com/sean-reid/time/issues/22)) ([3aa7293](https://github.com/sean-reid/time/commit/3aa72933a50a30f7c2c50a6e7bb1f6312db4ca19))
- **sim:** apply kicks to the running flight instead of replaying ([#24](https://github.com/sean-reid/time/issues/24)) ([552444e](https://github.com/sean-reid/time/commit/552444ef36ce785885efead1007ba69bc03d72e4))
- **sim:** restart returns the ship to its start orbit ([#26](https://github.com/sean-reid/time/issues/26)) ([056e5b6](https://github.com/sean-reid/time/commit/056e5b6a1d24a5ecee83e4b06443f629bd5cadba))

### Performance

- **font:** subset the typeface to the glyphs the site uses and the weights it sets ([#17](https://github.com/sean-reid/time/issues/17)) ([5a1e8f0](https://github.com/sean-reid/time/commit/5a1e8f0be54a68105c019a5792acbaa2f5a09005))
- inline stylesheets and set the LCP gate from measured medians ([#19](https://github.com/sean-reid/time/issues/19)) ([b12bb9d](https://github.com/sean-reid/time/commit/b12bb9d6b583cd54b5530f13e89f23430e2bf4b7))
