// Sci-Fi Hill Climb Racing - Rigid Body & Suspension Physics Engine
class PhysicsEngine {
    constructor() {
        this.gravity = 9.81 * 80; // Scaled for pixels/sec^2
        this.substeps = 6;       // Physics updates per frame for stability
    }

    // Solve one frames worth of physics
    update(vehicle, terrain, controls, upgrades, dt) {
        if (vehicle.crashed) return;

        const substepDt = dt / this.substeps;
        
        for (let step = 0; step < this.substeps; step++) {
            this.runSubstep(vehicle, terrain, controls, upgrades, substepDt);
        }
        
        // Track flip and air time status
        this.checkAirStunts(vehicle, dt);
    }

    runSubstep(vehicle, terrain, controls, upgrades, dt) {
        const chassis = vehicle.chassis;
        const frontWheel = vehicle.frontWheel;
        const rearWheel = vehicle.rearWheel;

        // Reset forces and torques
        chassis.forceX = 0;
        chassis.forceY = 0;
        chassis.torque = 0;

        frontWheel.forceX = 0;
        frontWheel.forceY = 0;
        frontWheel.torque = 0;
        frontWheel.inContact = false;

        rearWheel.forceX = 0;
        rearWheel.forceY = 0;
        rearWheel.torque = 0;
        rearWheel.inContact = false;

        // Apply Gravity
        chassis.forceY += chassis.mass * this.gravity;
        frontWheel.forceY += frontWheel.mass * this.gravity;
        rearWheel.forceY += rearWheel.mass * this.gravity;

        // Get Upgrades multipliers
        const enginePower = 2500000 + (upgrades.engine || 0) * 350000;
        const suspensionK = 9500 + (upgrades.suspension || 0) * 1250;
        const suspensionC = 420 + (upgrades.suspension || 0) * 95;
        const gripFactor = 1.0 + (upgrades.tires || 0) * 0.08;
        const thrusterPower = (upgrades.thrusters || 0) * 320;

        // 1. Resolve Wheel collisions with terrain (sets inContact status and contact forces)
        this.resolveWheelTerrain(frontWheel, chassis, terrain, gripFactor, dt);
        this.resolveWheelTerrain(rearWheel, chassis, terrain, gripFactor, dt);

        // 2. Suspension forces
        this.applySuspension(chassis, frontWheel, vehicle.frontAttach, suspensionK, suspensionC);
        this.applySuspension(chassis, rearWheel, vehicle.rearAttach, suspensionK, suspensionC);

        // 3. Drive Torque & Air Control
        const cosCar = Math.cos(chassis.angle);
        const sinCar = Math.sin(chassis.angle);
        const upX = sinCar;  // Direction perpendicular to car bottom, pointing UP (canvas y points down)
        const upY = -cosCar; 

        // Contact state
        const anyContact = frontWheel.inContact || rearWheel.inContact;

        if (!anyContact) {
            // Mid-air pitch control: Gas rotates counter-clockwise (nose up), Brake rotates clockwise (nose down)
            const airTorqueStrength = 48000 + (upgrades.engine || 0) * 3500;
            const boostActive = controls.boost && upgrades.thrusters > 0 && vehicle.thrusterFuel > 0;
            const finalEnginePower = enginePower * (boostActive ? 2.0 : 1.0);

            if (controls.gas || boostActive) {
                if (controls.gas) {
                    chassis.torque -= airTorqueStrength;
                }
                // Mid-air jet propulsion forward (2x acceleration speed if booster is active)
                chassis.forceX += finalEnginePower * 0.03 * cosCar;
                chassis.forceY += finalEnginePower * 0.03 * sinCar;
            }
            if (controls.brake) {
                chassis.torque += airTorqueStrength;
                // Mid-air jet braking backward
                chassis.forceX -= enginePower * 0.03 * cosCar;
                chassis.forceY -= enginePower * 0.03 * sinCar;
            }
            vehicle.airTime += dt;
        } else {
            vehicle.airTime = 0;
            
            // Active Anti-Topple Stability Control (Ground torque assistance)
            const baseStabilityTorque = (vehicle.baseStability || 28000) + (upgrades.engine || 0) * 1500;
            const stabilitySlope = (vehicle.stabilitySlope || 48000) + (upgrades.engine || 0) * 3000;

            if (rearWheel.inContact && !frontWheel.inContact && chassis.angle > 0.03) {
                // Nose lifting (potential backflip) -> apply restoring counter-torque
                const stabilityTorque = Math.min(baseStabilityTorque, stabilitySlope * Math.sin(chassis.angle));
                chassis.torque -= stabilityTorque;
            } else if (frontWheel.inContact && !rearWheel.inContact && chassis.angle < -0.03) {
                // Nose diving (potential frontflip) -> apply correcting torque
                const stabilityTorque = Math.min(baseStabilityTorque, stabilitySlope * Math.sin(-chassis.angle));
                chassis.torque += stabilityTorque;
            }

            // Pedal-driven active balance control (Counter-balance assistance on the ground)
            const pedalAssistTorque = (vehicle.pedalAssist || 42000) + (upgrades.engine || 0) * 2500;
            if (controls.gas) {
                // Gas tilts the car backward (lifts nose / counter-clockwise torque)
                chassis.torque -= pedalAssistTorque;
            }
            if (controls.brake) {
                // Brake tilts the car forward (lowers nose / clockwise torque)
                chassis.torque += pedalAssistTorque;
            }
            
            const boostActive = controls.boost && upgrades.thrusters > 0 && vehicle.thrusterFuel > 0;

            // Driving Torque (AWD - 65% Rear, 35% Front)
            if ((controls.gas || boostActive) && vehicle.fuel > 0) {
                let rearGasMult = 0.65;
                let frontGasMult = 0.35;

                // Active Wheelie Control: cut rear power if nose lifts too high while accelerating
                if (rearWheel.inContact && !frontWheel.inContact && chassis.angle > 0.12) {
                    const factor = Math.max(0.35, 1.0 - (chassis.angle - 0.12) * 2.5);
                    rearGasMult *= factor;
                }

                // 2x acceleration power if booster is active
                const finalEnginePower = enginePower * (boostActive ? 2.0 : 1.0);

                rearWheel.torque += finalEnginePower * rearGasMult;
                frontWheel.torque += finalEnginePower * frontGasMult;

                if (controls.gas) {
                    vehicle.fuel -= 6.0 * dt; // Consume fuel when gas is pressed
                }
            }
            // Braking / Reverse
            if (controls.brake) {
                // If moving forward, apply brakes. If stopped/going backwards, apply reverse
                const speed = (frontWheel.vx + rearWheel.vx) / 2;
                if (speed > 10) {
                    let brakeMult = 1.5;
                    // Active Endo Control: cut front braking if rear wheel lifts while braking at speed
                    if (frontWheel.inContact && !rearWheel.inContact && chassis.angle < -0.12) {
                        const factor = Math.max(0.4, 1.0 - (-chassis.angle - 0.12) * 2.5);
                        brakeMult *= factor;
                    }
                    rearWheel.torque -= enginePower * brakeMult;
                    frontWheel.torque -= enginePower * brakeMult;
                } else if (vehicle.fuel > 0) {
                    // Reverse torque
                    rearWheel.torque -= enginePower * 0.4;
                    frontWheel.torque -= enginePower * 0.2;
                    vehicle.fuel -= 4.0 * dt;
                }
            }
        }

        // 4. Thruster Boost
        if (controls.boost && upgrades.thrusters > 0 && vehicle.thrusterFuel > 0) {
            // Apply upward force perpendicular to chassis
            chassis.forceX += upX * thrusterPower;
            chassis.forceY += upY * thrusterPower;
            
            // Consume thruster fuel
            vehicle.thrusterFuel -= 25.0 * dt;
            vehicle.boosting = true;
        } else {
            vehicle.boosting = false;
        }

        // Apply battery / shield drain slowly over time just by running
        vehicle.fuel -= 1.8 * dt; 
        if (vehicle.fuel < 0) vehicle.fuel = 0;
        if (vehicle.thrusterFuel < 0) vehicle.thrusterFuel = 0;

        // Recharge thruster booster slowly when in contact with ground
        if (anyContact && !controls.boost && vehicle.thrusterFuel < 100) {
            vehicle.thrusterFuel = Math.min(100, vehicle.thrusterFuel + 12.0 * dt);
        }

        // 5. Integrate Velocities and Positions for wheels
        this.integrateParticle(frontWheel, dt);
        this.integrateParticle(rearWheel, dt);

        // Integrate wheel rotations (omega) using total accumulated torques (engine and friction)
        frontWheel.omega += (frontWheel.torque / frontWheel.inertia) * dt;
        frontWheel.omega *= Math.pow(0.975, dt * 60);
        rearWheel.omega += (rearWheel.torque / rearWheel.inertia) * dt;
        rearWheel.omega *= Math.pow(0.975, dt * 60);

        // 6. Integrate Chassis
        chassis.vx += (chassis.forceX / chassis.mass) * dt;
        chassis.vy += (chassis.forceY / chassis.mass) * dt;
        chassis.x += chassis.vx * dt;
        chassis.y += chassis.vy * dt;
        chassis.angularVelocity += (chassis.torque / chassis.inertia) * dt;
        chassis.angle += chassis.angularVelocity * dt;

        // Apply air resistance / drag
        chassis.vx *= Math.pow(0.992, dt * 60);
        chassis.vy *= Math.pow(0.992, dt * 60);
        chassis.angularVelocity *= Math.pow(0.95, dt * 60);

        // 7. Satisfy Hard Suspension Constraints (Keep wheels connected to chassis)
        this.constrainSuspension(chassis, frontWheel, vehicle.frontAttach, vehicle.minSuspension, vehicle.maxSuspension);
        this.constrainSuspension(chassis, rearWheel, vehicle.rearAttach, vehicle.minSuspension, vehicle.maxSuspension);

        // 8. Chassis collision with terrain (check bumper, roof, undercarriage)
        this.resolveChassisTerrain(vehicle, terrain);
    }

    // Spring suspension force computation
    applySuspension(chassis, wheel, localAttach, stiffness, damping) {
        // Attachment point in world coordinates
        const cos = Math.cos(chassis.angle);
        const sin = Math.sin(chassis.angle);
        const ax = chassis.x + localAttach.x * cos - localAttach.y * sin;
        const ay = chassis.y + localAttach.x * sin + localAttach.y * cos;

        if (chassis.modelId === 'ufo') {
            // Rigid suspension: transmit all wheel contact forces directly to the chassis
            const contactFX = wheel.forceX;
            const contactFY = wheel.forceY - wheel.mass * this.gravity;

            // Apply to chassis
            chassis.forceX += contactFX;
            chassis.forceY += contactFY;

            // Apply torque on chassis: r x F
            const rx = ax - chassis.x;
            const ry = ay - chassis.y;
            chassis.torque += rx * contactFY - ry * contactFX;

            // Zero out wheel forces so they don't accelerate the wheel separately
            wheel.forceX = 0;
            wheel.forceY = 0;
            return;
        }

        // Suspension direction (local Y points down, so normal pointing down relative to chassis)
        const dirX = -sin;
        const dirY = cos;

        // Difference vector
        const dx = wheel.x - ax;
        const dy = wheel.y - ay;

        // Distance along suspension axis
        const distU = dx * dirX + dy * dirY;

        // Chassis velocity at attachment point
        const avx = chassis.vx - chassis.angularVelocity * (ay - chassis.y);
        const avy = chassis.vy + chassis.angularVelocity * (ax - chassis.x);

        // Relative velocity along suspension axis
        const rvx = wheel.vx - avx;
        const rvy = wheel.vy - avy;
        const velU = rvx * dirX + rvy * dirY;

        // Rest length of suspension spring is 45 pixels
        const restLength = 45;
        const F_susp = -stiffness * (distU - restLength) - damping * velU;

        // Force vector
        const fx = F_susp * dirX;
        const fy = F_susp * dirY;

        // Apply to wheel
        wheel.forceX += fx;
        wheel.forceY += fy;

        // Apply equal and opposite to chassis
        chassis.forceX -= fx;
        chassis.forceY -= fy;

        // Apply torque on chassis: r x F
        const rx = ax - chassis.x;
        const ry = ay - chassis.y;
        chassis.torque += rx * (-fy) - ry * (-fx);
    }

    // Constrain the wheel position and velocity to stay aligned on the suspension axis
    constrainSuspension(chassis, wheel, localAttach, minLen, maxLen) {
        const cos = Math.cos(chassis.angle);
        const sin = Math.sin(chassis.angle);
        const ax = chassis.x + localAttach.x * cos - localAttach.y * sin;
        const ay = chassis.y + localAttach.x * sin + localAttach.y * cos;

        // Axis vectors: u is along suspension (down), v is lateral (right)
        const ux = -sin;
        const uy = cos;
        const vx = cos;
        const vy = sin;

        // Distance vector
        let dx = wheel.x - ax;
        let dy = wheel.y - ay;

        // Projection
        let distU = dx * ux + dy * uy;
        
        // Clamp suspension limits
        if (distU < minLen) distU = minLen;
        if (distU > maxLen) distU = maxLen;

        // Force lateral offset to be exactly 0 (hard lateral constraint)
        wheel.x = ax + distU * ux;
        wheel.y = ay + distU * uy;

        // Correct velocity: relative lateral velocity must be 0
        const avx = chassis.vx - chassis.angularVelocity * (ay - chassis.y);
        const avy = chassis.vy + chassis.angularVelocity * (ax - chassis.x);

        const rvx = wheel.vx - avx;
        const rvy = wheel.vy - avy;

        const relU = rvx * ux + rvy * uy;

        // Re-assign wheel velocity: attachment velocity + relative longitudinal velocity
        wheel.vx = avx + relU * ux;
        wheel.vy = avy + relU * uy;
    }

    integrateParticle(p, dt) {
        p.vx += (p.forceX / p.mass) * dt;
        p.vy += (p.forceY / p.mass) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        // Damping on particle velocity (rolling resistance / air drag)
        p.vx *= Math.pow(0.995, dt * 60);
        p.vy *= Math.pow(0.995, dt * 60);
    }

    resolveWheelTerrain(wheel, chassis, terrain, gripFactor, dt) {
        const terrainInfo = terrain.getTerrainInfo(wheel.x);
        if (!terrainInfo) return;

        // Vector from terrain point to wheel center
        const dx = wheel.x - wheel.x;
        const dy = wheel.y - terrainInfo.y;

        // Project onto normal (N points UP, which is negative Y)
        const distNormal = dx * terrainInfo.nx + dy * terrainInfo.ny;

        // Collision occurs if distance along normal is less than radius
        const penetration = wheel.radius - distNormal;

        if (penetration > 0) {
            wheel.inContact = true;

            // Push wheel out of ground along normal
            wheel.x += terrainInfo.nx * penetration;
            wheel.y += terrainInfo.ny * penetration;

            // Normal velocity
            const vNormal = wheel.vx * terrainInfo.nx + wheel.vy * terrainInfo.ny;

            // Penalty-based contact force
            const K_ground = 16000;
            const C_ground = 250;
            const F_normal_mag = Math.max(0, K_ground * penetration - C_ground * vNormal);
            
            // Add normal force
            wheel.forceX += terrainInfo.nx * F_normal_mag;
            wheel.forceY += terrainInfo.ny * F_normal_mag;

            // Friction / Traction
            // Tangent points forward along slope (T.x > 0)
            const vSlide = (wheel.vx * terrainInfo.tx + wheel.vy * terrainInfo.ty) - wheel.omega * wheel.radius;
            
            // Grip friction coefficient
            const K_friction = 1200;
            let F_friction_mag = -vSlide * K_friction;
            
            // Coulomb friction limit
            const maxFriction = F_normal_mag * wheel.grip * gripFactor;
            F_friction_mag = Math.max(-maxFriction, Math.min(maxFriction, F_friction_mag));

            // Apply friction force
            wheel.forceX += terrainInfo.tx * F_friction_mag;
            wheel.forceY += terrainInfo.ty * F_friction_mag;

            // Transmit lateral contact forces to chassis (via rigid suspension arm)
            const cos = Math.cos(chassis.angle);
            const sin = Math.sin(chassis.angle);
            const vx = cos;
            const vy = sin;
            
            // Total contact force vector
            const F_cx = terrainInfo.nx * F_normal_mag + terrainInfo.tx * F_friction_mag;
            const F_cy = terrainInfo.ny * F_normal_mag + terrainInfo.ty * F_friction_mag;
            
            // Project onto lateral axis of the vehicle
            const F_lat = F_cx * vx + F_cy * vy;
            
            const rx = wheel.x - chassis.x;
            const ry = wheel.y - chassis.y;
            
            chassis.forceX += F_lat * vx;
            chassis.forceY += F_lat * vy;
            chassis.torque += rx * (F_lat * vy) - ry * (F_lat * vx);

            // Torque reaction on wheel spin
            wheel.torque -= F_friction_mag * wheel.radius;
        }

    }

    resolveChassisTerrain(vehicle, terrain) {
        const chassis = vehicle.chassis;
        const cos = Math.cos(chassis.angle);
        const sin = Math.sin(chassis.angle);

        // Check 6 key points of the SUV body: 4 corners + mid-bottom (undercarriage) + mid-top (roof center)
        const hw = chassis.width / 2;
        const hh = chassis.height / 2;

        const corners = [
            { x: -hw, y: -hh, type: 'roof' },      // Rear-top
            { x: 0, y: -hh, type: 'roof' },       // Mid-top
            { x: hw, y: -hh, type: 'roof' },       // Front-top
            { x: hw, y: hh, type: 'bumper' },      // Front-bottom
            { x: 0, y: hh, type: 'bumper' },       // Mid-bottom (undercarriage center)
            { x: -hw, y: hh, type: 'bumper' }      // Rear-bottom
        ];

        let crashTriggered = false;

        corners.forEach(c => {
            // World position of corner
            const wx = chassis.x + c.x * cos - c.y * sin;
            const wy = chassis.y + c.x * sin + c.y * cos;

            const terrainInfo = terrain.getTerrainInfo(wx);
            if (!terrainInfo) return;

            // Collision check: if corner is below terrain (wy > terrainInfo.y)
            if (wy > terrainInfo.y) {
                const penetration = wy - terrainInfo.y;

                if (c.type === 'bumper') {
                    // Position correction: push out of ground along terrain normal
                    chassis.x += terrainInfo.nx * penetration * 0.45;
                    chassis.y += terrainInfo.ny * penetration * 0.45;

                    // Recalculate relative vector rx, ry from chassis center of mass after push-out
                    const rx = wx - chassis.x;
                    const ry = wy - chassis.y;

                    // Corner velocity in world coordinates
                    const cvx = chassis.vx - chassis.angularVelocity * ry;
                    const cvy = chassis.vy + chassis.angularVelocity * rx;

                    // Velocity along normal (negative means moving into ground)
                    const vNormal = cvx * terrainInfo.nx + cvy * terrainInfo.ny;

                    if (vNormal < 0) {
                        const e = 0.55; // Restitution (bounce factor)
                        const rCrossN = rx * terrainInfo.ny - ry * terrainInfo.nx;
                        const invMass = (1.0 / chassis.mass) + (rCrossN * rCrossN / chassis.inertia);
                        const impulse = -(1 + e) * vNormal / invMass;

                        // Apply normal impulse
                        chassis.vx += terrainInfo.nx * impulse / chassis.mass;
                        chassis.vy += terrainInfo.ny * impulse / chassis.mass;
                        chassis.angularVelocity += rCrossN * impulse / chassis.inertia;

                        // Play thud sound if impact is significant
                        if (Math.abs(vNormal) > 50 && window.audioEngine) {
                            const soundIntensity = Math.abs(vNormal) / 250;
                            window.audioEngine.playBump(soundIntensity);
                        }

                        // Spawn dust/ground particles
                        if (Math.abs(vNormal) > 60 && window.game && window.game.particles) {
                            const particleCount = Math.min(8, Math.floor(Math.abs(vNormal) / 40) + 2);
                            for (let i = 0; i < particleCount; i++) {
                                window.game.particles.push({
                                    x: wx,
                                    y: wy,
                                    vx: -terrainInfo.tx * (vNormal * 0.2) + (Math.random() - 0.5) * 80,
                                    vy: -terrainInfo.ty * (vNormal * 0.2) - Math.random() * 50 - 20,
                                    size: Math.random() * 3 + 1.5,
                                    color: window.game.activeStage === 'cyberpunk' ? '#00ffcc' : (window.game.activeStage === 'lunar' ? '#a0a0a0' : '#ff00ff'),
                                    life: 0.5,
                                    maxLife: 0.5
                                });
                            }
                        }

                        // Friction impulse (Coulomb friction along tangent)
                        const vTangent = cvx * terrainInfo.tx + cvy * terrainInfo.ty;
                        const rCrossT = rx * terrainInfo.ty - ry * terrainInfo.tx;
                        const invMassT = (1.0 / chassis.mass) + (rCrossT * rCrossT / chassis.inertia);
                        const frictionCoeff = 0.35;
                        const impulseT = -vTangent / invMassT;
                        const maxFriction = frictionCoeff * impulse;
                        const appliedFriction = Math.max(-maxFriction, Math.min(maxFriction, impulseT));

                        chassis.vx += terrainInfo.tx * appliedFriction / chassis.mass;
                        chassis.vy += terrainInfo.ty * appliedFriction / chassis.mass;
                        chassis.angularVelocity += rCrossT * appliedFriction / chassis.inertia;
                    }
                } else if (c.type === 'roof') {
                    // Roof contact (toppling upside down) triggers crash
                    if (penetration > 2.0) {
                        crashTriggered = true;
                    }
                }
            }
        });

        if (crashTriggered) {
            vehicle.crashed = true;
        }
    }

    checkAirStunts(vehicle, dt) {
        const chassis = vehicle.chassis;
        const frontWheel = vehicle.frontWheel;
        const rearWheel = vehicle.rearWheel;

        const inAir = !frontWheel.inContact && !rearWheel.inContact;

        if (inAir) {
            // Track total rotation in air
            if (vehicle.lastAirAngle !== null) {
                let diff = chassis.angle - vehicle.lastAirAngle;
                // Normalize angle diff
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                vehicle.airRotationAccumulator += diff;
            }
            vehicle.lastAirAngle = chassis.angle;
        } else {
            // Landed - check if stunts completed
            if (vehicle.airRotationAccumulator !== 0) {
                const degrees = (vehicle.airRotationAccumulator * 180) / Math.PI;
                
                // Frontflip: rotated positive ~360 degrees (clockwise in air)
                // Backflip: rotated negative ~360 degrees (counter-clockwise)
                if (degrees > 270) {
                    vehicle.stunts.push({ name: "FRONTFLIP!", reward: 500, time: 2.0 });
                } else if (degrees < -270) {
                    vehicle.stunts.push({ name: "BACKFLIP!", reward: 500, time: 2.0 });
                } else if (vehicle.airTime > 1.8) {
                    const airTimeSec = vehicle.airTime.toFixed(1);
                    vehicle.stunts.push({ name: `BIG AIR! (${airTimeSec}s)`, reward: Math.floor(vehicle.airTime * 150), time: 2.0 });
                }

                vehicle.airRotationAccumulator = 0;
            }
            vehicle.lastAirAngle = null;
        }
    }
}

// Export singleton
window.PhysicsEngine = PhysicsEngine;
