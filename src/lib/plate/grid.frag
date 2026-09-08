#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uMpp;
uniform vec2 uCentreRes;
uniform vec2 uCentre;
uniform float uRs;
uniform float uSpacing;
uniform float uSubFade;
uniform float uCoarseOn;
uniform vec3 uInk;
uniform float uInner;

out vec4 outColor;

float lineAt(vec2 f, float weight) {
	vec2 g = abs(fract(f - 0.5) - 0.5) / fwidth(f);
	float d = min(g.x, g.y);
	return (1.0 - smoothstep(0.0, 1.0, d)) * weight;
}

void main() {
	vec2 offset = (gl_FragCoord.xy - uRes * 0.5) * uMpp;
	vec2 world = offset + uCentre;
	float r = length(world);
	if (uRs > 0.0 && r <= uInner) {
		outColor = vec4(0.0);
		return;
	}
	vec2 disp = vec2(0.0);
	if (uRs > 0.0 && r > uRs) {
		float a = sqrt(r);
		float b = sqrt(r - uRs);
		float dRho = uRs * (log((a + b) / sqrt(uRs)) - r / (a * b + r));
		disp = world * (dRho / r);
	}
	vec2 p = offset + uCentreRes + disp;
	float alpha = lineAt(p / uSpacing, 1.0);
	alpha = max(alpha, lineAt(p / (uSpacing * 0.1), 0.55 * uSubFade));
	alpha = max(alpha, lineAt(p / (uSpacing * 10.0), 1.0) * uCoarseOn);
	outColor = vec4(uInk * alpha, alpha);
}
