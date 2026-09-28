export type GravityBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
};

// Artistic pixel/second units, not astronomical scale. Softening avoids singularities.
export const GRAVITY = 1200;
export const SOFTENING = 32;
export const PHYSICS_STEP = 1 / 120;

export function accelerations(bodies: GravityBody[]) {
  const result = bodies.map(() => ({ x: 0, y: 0 }));
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const force = GRAVITY / (dx * dx + dy * dy + SOFTENING ** 2) ** 1.5;
      result[i].x += dx * force * bodies[j].mass;
      result[i].y += dy * force * bodies[j].mass;
      result[j].x -= dx * force * bodies[i].mass;
      result[j].y -= dy * force * bodies[i].mass;
    }
  }
  return result;
}

// Velocity Verlet: symmetric kicks keep orbits stable without frame-rate dependence.
export function stepGravity(bodies: GravityBody[], dt: number) {
  const before = accelerations(bodies);
  bodies.forEach((body, i) => {
    body.vx += before[i].x * dt / 2;
    body.vy += before[i].y * dt / 2;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  });
  const after = accelerations(bodies);
  bodies.forEach((body, i) => {
    body.vx += after[i].x * dt / 2;
    body.vy += after[i].y * dt / 2;
  });
}

// Bound initial velocities around each chapter's barycentre; no orbit is prescribed.
// All groups subsequently share the same pairwise force calculation.
export function seedOrbits(bodies: GravityBody[]) {
  const mass = bodies.reduce((sum, body) => sum + body.mass, 0);
  if (!mass || bodies.length < 2) return;
  const x = bodies.reduce((sum, body) => sum + body.x * body.mass, 0) / mass;
  const y = bodies.reduce((sum, body) => sum + body.y * body.mass, 0) / mass;
  const pull = accelerations(bodies);
  bodies.forEach((body, i) => {
    const dx = body.x - x, dy = body.y - y;
    const radius = Math.hypot(dx, dy);
    const speed = Math.sqrt(Math.max(0, -(pull[i].x * dx + pull[i].y * dy)));
    body.vx = radius ? -dy / radius * speed : 0;
    body.vy = radius ? dx / radius * speed : 0;
  });
  const vx = bodies.reduce((sum, body) => sum + body.vx * body.mass, 0) / mass;
  const vy = bodies.reduce((sum, body) => sum + body.vy * body.mass, 0) / mass;
  bodies.forEach((body) => { body.vx -= vx; body.vy -= vy; });
}
