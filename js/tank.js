// tank.js - Tank Enemy Logic and Drawing Definitions

// --- Tank Constants ---
const TANK_SCALE_FACTOR = 0.35; // Default scale for tanks created by spawnNewTank

// Tank Colors (as per detailed design)
const TANK_MAIN_BODY_COLOR = '#FF7C00'; // bright flame-orange
const TANK_SHADOW_COLOR = '#803000';    // deep rust-brown
const TANK_TREAD_HOUSING_COLOR = '#4A3A2D'; // muted brown/gray (used for darker tread segments)
const TANK_TREAD_LIGHT_COLOR = '#604030'; // Lighter brown for tread segments
const TANK_GUN_METAL_COLOR = '#555555'; // Darker grey for gun
const TANK_GUN_HIGHLIGHT_COLOR = '#FF9900'; // sharp golden-orange
const TANK_OUTLINE_COLOR = '#002E6D'; // deep blue (used as primary outline)
const TANK_METALLIC_REFLECTION_COLOR = '#0C6FEF'; // cool blue glow

// Tank Animation Parameters
const TANK_INITIAL_BARREL_ANGLE = -Math.PI / 2 - (Math.PI / 20); // Default aim (slightly forward from straight up)
const TANK_BARREL_TURN_SPEED = 0.025; // Radians per frame for barrel rotation
const TANK_BARREL_MOVE_INTERVAL = 100; // Frames before picking a new random target angle
const TANK_TREAD_ANIMATION_SPEED = 1.1; // Visual speed of treads scrolling

// Note: The 'tanks' array itself will be managed in the main game script.
// This file provides the functions to create, update (animations), and draw individual tanks.

// --- Tank Helper function to draw polygons ---
function drawTankPolygon(ctx, points, color, fill = true, lineWidth = 1, strokeColor = color, scale = 1) {
    if (!points || points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.lineWidth = lineWidth * scale; // Apply scaling to line width for consistency
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
}

// --- Tank Part Drawing Functions (Parameterized for individual tank instances) ---

function drawTankOuterOutline(pCtx, pX, pY, pScale) {
    const s = pScale;
    const bodyWidth = 160 * s; // Overall width including outline effect
    const bodyHeight = 220 * s; // Overall height including outline effect
    const bodyDrawY = pY - bodyHeight / 2; // Center the tank vertically based on pY
    const centerX = pX; // Center the tank horizontally based on pX
    const outlineRadius = 20 * s; // Radius for rounded corners of the outline

    pCtx.save(); // Save context state
    pCtx.beginPath();
    // Constructing a rounded rectangle path for the outline
    pCtx.moveTo(centerX - bodyWidth / 2 - 5*s + outlineRadius, bodyDrawY - 5*s);
    pCtx.lineTo(centerX + bodyWidth / 2 + 5*s - outlineRadius, bodyDrawY - 5*s);
    pCtx.quadraticCurveTo(centerX + bodyWidth / 2 + 5*s, bodyDrawY - 5*s, centerX + bodyWidth / 2 + 5*s, bodyDrawY - 5*s + outlineRadius);
    pCtx.lineTo(centerX + bodyWidth / 2 + 5*s, bodyDrawY + bodyHeight + 5*s - outlineRadius);
    pCtx.quadraticCurveTo(centerX + bodyWidth / 2 + 5*s, bodyDrawY + bodyHeight + 5*s, centerX + bodyWidth / 2 + 5*s - outlineRadius, bodyDrawY + bodyHeight + 5*s);
    pCtx.lineTo(centerX - bodyWidth / 2 - 5*s + outlineRadius, bodyDrawY + bodyHeight + 5*s);
    pCtx.quadraticCurveTo(centerX - bodyWidth / 2 - 5*s, bodyDrawY + bodyHeight + 5*s, centerX - bodyWidth / 2 - 5*s, bodyDrawY + bodyHeight + 5*s - outlineRadius);
    pCtx.lineTo(centerX - bodyWidth / 2 - 5*s, bodyDrawY - 5*s + outlineRadius);
    pCtx.quadraticCurveTo(centerX - bodyWidth / 2 - 5*s, bodyDrawY - 5*s, centerX - bodyWidth / 2 - 5*s + outlineRadius, bodyDrawY - 5*s);
    pCtx.closePath();
    
    // Outer glow effect
    pCtx.strokeStyle = TANK_METALLIC_REFLECTION_COLOR;
    pCtx.lineWidth = 6 * s; // Thicker line for the glow
    pCtx.lineJoin = "round"; // Smoother corners for the stroke
    pCtx.stroke();

    // Inner darker outline
    pCtx.strokeStyle = TANK_OUTLINE_COLOR;
    pCtx.lineWidth = 3 * s;
    pCtx.stroke();
    pCtx.restore(); // Restore context state
}

function drawTankTreads(pCtx, pX, pY, pScale, pTreadOffset) {
    const s = pScale;
    const numTreadSegments = 10; // Number of visible blocky segments
    const treadTotalHeight = 200 * s; // Total visual height of the tread area
    const treadSegmentHeight = treadTotalHeight / numTreadSegments;
    const treadWidth = 50 * s; // Width of each tread track
    const gapFromCenter = 70 * s; // Distance from tank's centerline (pX) to inner edge of tread
    const treadDrawStartY = pY - treadTotalHeight / 2; // Top Y of the tread drawing area
    const centerX = pX; // Tank's horizontal center

    pCtx.save();
    // Main housing for treads (slightly darker background for segments)
    pCtx.fillStyle = TANK_TREAD_HOUSING_COLOR;
    pCtx.fillRect(centerX - gapFromCenter - treadWidth, treadDrawStartY - 2*s, treadWidth, treadTotalHeight + 4*s);
    pCtx.fillRect(centerX + gapFromCenter, treadDrawStartY - 2*s, treadWidth, treadTotalHeight + 4*s);

    // Draw individual tread segments
    for (let i = 0; i < numTreadSegments + 1; i++) { // +1 to ensure seamless wrapping during animation
        let segmentY = treadDrawStartY + (i * treadSegmentHeight) + pTreadOffset - treadSegmentHeight;
        
        // Wrap segmentY for continuous animation
        if (segmentY > treadDrawStartY + treadTotalHeight - treadSegmentHeight / 2) {
            segmentY -= (treadTotalHeight + treadSegmentHeight);
        }
         if (segmentY < treadDrawStartY - treadSegmentHeight / 2) {
            segmentY += (treadTotalHeight + treadSegmentHeight);
        }

        // Draw segment only if it's within the visible tread area
        if (segmentY > treadDrawStartY - treadSegmentHeight && segmentY < treadDrawStartY + treadTotalHeight) {
            pCtx.fillStyle = (i % 2 === 0) ? TANK_TREAD_HOUSING_COLOR : TANK_TREAD_LIGHT_COLOR; // Alternating colors
            const segDrawHeight = treadSegmentHeight - 2*s; // Create a small gap between segments

            // Left Tread Segment
            pCtx.fillRect(centerX - gapFromCenter - treadWidth, segmentY, treadWidth, segDrawHeight);
            pCtx.strokeStyle = TANK_SHADOW_COLOR; // Outline for segment definition
            pCtx.lineWidth = 1*s;
            pCtx.strokeRect(centerX - gapFromCenter - treadWidth, segmentY, treadWidth, segDrawHeight);

            // Right Tread Segment
            pCtx.fillRect(centerX + gapFromCenter, segmentY, treadWidth, segDrawHeight);
            pCtx.strokeRect(centerX + gapFromCenter, segmentY, treadWidth, segDrawHeight);
        }
    }
    // Outline for the entire tread housings
    pCtx.strokeStyle = TANK_OUTLINE_COLOR;
    pCtx.lineWidth = 2 * s;
    pCtx.strokeRect(centerX - gapFromCenter - treadWidth, treadDrawStartY - 2*s, treadWidth, treadTotalHeight + 4*s);
    pCtx.strokeRect(centerX + gapFromCenter, treadDrawStartY - 2*s, treadWidth, treadTotalHeight + 4*s);
    pCtx.restore();
}

function drawTankBody(pCtx, pX, pY, pScale) {
    const s = pScale;
    const bodyWidth = 140 * s; // Width of the main hull
    const bodyHeight = 190 * s; // Height of the main hull
    const bodyDrawY = pY - bodyHeight / 2; // Top Y of the hull
    const centerX = pX; // Horizontal center of the hull

    pCtx.save();
    // Main Body Shape (more angular based on tank2.png)
    const bodyPoints = [
        { x: centerX - bodyWidth / 2, y: bodyDrawY },
        { x: centerX + bodyWidth / 2, y: bodyDrawY },
        { x: centerX + bodyWidth / 2 - 10*s, y: bodyDrawY + bodyHeight }, // Tapered bottom
        { x: centerX - bodyWidth / 2 + 10*s, y: bodyDrawY + bodyHeight }  // Tapered bottom
    ];
    drawTankPolygon(pCtx, bodyPoints, TANK_MAIN_BODY_COLOR, true, 2*s, TANK_SHADOW_COLOR, s);

    // Front angled plate
    const frontPlatePoints = [
        { x: centerX - bodyWidth/2 + 20*s, y: bodyDrawY - 20*s}, // Top edge of angled plate
        { x: centerX + bodyWidth/2 - 20*s, y: bodyDrawY - 20*s},
        { x: centerX + bodyWidth/2, y: bodyDrawY}, // Connects to main body top
        { x: centerX - bodyWidth/2, y: bodyDrawY}
    ];
    drawTankPolygon(pCtx, frontPlatePoints, TANK_MAIN_BODY_COLOR, true, 2*s, TANK_SHADOW_COLOR, s);

    // Panel Lines and Details
    pCtx.strokeStyle = TANK_SHADOW_COLOR;
    pCtx.lineWidth = 2.5 * s;

    // Center raised panel on the hull
    const centerPanelWidth = 80 * s;
    const centerPanelHeight = 120 * s;
    const centerPanelY = bodyDrawY + 30 * s; // Positioned on the hull
    pCtx.fillStyle = TANK_MAIN_BODY_COLOR; // Could be slightly lighter or same with shadow for depth
    pCtx.fillRect(centerX - centerPanelWidth/2, centerPanelY, centerPanelWidth, centerPanelHeight);
    pCtx.strokeRect(centerX - centerPanelWidth/2, centerPanelY, centerPanelWidth, centerPanelHeight); // Outline for the panel

    // Small rectangular details on the hull (like vents or access panels)
    const detailWidth = 25 * s;
    const detailHeight = 15 * s;
    pCtx.fillStyle = TANK_SHADOW_COLOR; // Darker details for contrast
    pCtx.fillRect(centerX - bodyWidth/2 + 15*s, bodyDrawY + bodyHeight - 40*s, detailWidth, detailHeight);
    pCtx.fillRect(centerX + bodyWidth/2 - 15*s - detailWidth, bodyDrawY + bodyHeight - 40*s, detailWidth, detailHeight);
    // Smaller front details
    pCtx.fillRect(centerX - bodyWidth/2 + 30*s, bodyDrawY + 10*s, detailWidth*0.8, detailHeight*0.8);
    pCtx.fillRect(centerX + bodyWidth/2 - 30*s - detailWidth*0.8, bodyDrawY + 10*s, detailWidth*0.8, detailHeight*0.8);
    pCtx.restore();
}

function drawTankTurret(pCtx, pX, pY, pScale) {
    const s = pScale;
    const turretMajorRadius = 55 * s; // Wider base of the turret
    const turretMinorRadius = 45 * s; // Shorter radius for top-down perspective illusion
    const turretBaseYOffset = -15 * s; // How much turret center is shifted forward from tank's pY
    const turretDrawY = pY + turretBaseYOffset; // Actual Y center for drawing the turret
    const centerX = pX; // Tank's horizontal center

    pCtx.save();
    // Turret Base (more octagonal/angular shape)
    const turretBasePoints = [
        { x: centerX - turretMajorRadius * 0.6, y: turretDrawY - turretMinorRadius }, // Top-leftish
        { x: centerX + turretMajorRadius * 0.6, y: turretDrawY - turretMinorRadius }, // Top-rightish
        { x: centerX + turretMajorRadius,       y: turretDrawY },                         // Mid-right
        { x: centerX + turretMajorRadius * 0.6, y: turretDrawY + turretMinorRadius }, // Bottom-rightish
        { x: centerX - turretMajorRadius * 0.6, y: turretDrawY + turretMinorRadius }, // Bottom-leftish
        { x: centerX - turretMajorRadius,       y: turretDrawY },                         // Mid-left
    ];
    drawTankPolygon(pCtx, turretBasePoints, TANK_SHADOW_COLOR, true, 2*s, TANK_OUTLINE_COLOR, s); // Darker base with outline

    // Turret Top (smaller, main body color, slightly raised)
    const turretTopPoints = turretBasePoints.map(p => ({
        x: centerX + (p.x - centerX) * 0.8, // Scale down towards the center
        y: (turretDrawY - 5*s) + (p.y - turretDrawY) * 0.8 // Scale down and shift slightly up
    }));
    drawTankPolygon(pCtx, turretTopPoints, TANK_MAIN_BODY_COLOR, true, 2*s, TANK_SHADOW_COLOR, s);

    // "Face" details on turret, inspired by tank2.png
    const eyeSize = 8 * s;
    const eyeY = turretDrawY - 10*s; // Position eyes on the upper part of turret
    pCtx.fillStyle = TANK_SHADOW_COLOR;
    pCtx.fillRect(centerX - 20*s - eyeSize/2, eyeY - eyeSize/2, eyeSize, eyeSize); // Left eye
    pCtx.fillRect(centerX + 20*s - eyeSize/2, eyeY - eyeSize/2, eyeSize, eyeSize); // Right eye

    const mouthWidth = 30*s;
    const mouthHeight = 6*s;
    pCtx.fillRect(centerX - mouthWidth/2, turretDrawY + 10*s, mouthWidth, mouthHeight); // Mouth-like slit
    pCtx.restore();
}

function drawTankGunBarrel(pCtx, pX, pY, pScale, pBarrelAngle) {
    const s = pScale;
    const barrelLength = 80 * s;
    const barrelWidth = 18 * s;
    const barrelBaseWidth = 25 * s; // Wider base connecting to turret
    const barrelBaseHeight = 15*s;  // Length of the base part
    
    // Calculate gun mount point relative to tank's (pX, pY)
    const turretBaseYOffset = -15 * s; // Y offset of the turret center from tank's pY
    const gunPivotYOffset = -5 * s;   // Additional Y offset for the gun's pivot from turret center
    const gunMountX = pX; // Gun mounts at the tank's horizontal center
    const gunMountY = pY + turretBaseYOffset + gunPivotYOffset; // Actual Y pivot point for the gun

    pCtx.save();
    pCtx.translate(gunMountX, gunMountY); // Move origin to gun's pivot point
    pCtx.rotate(pBarrelAngle); // Rotate the entire gun assembly
    
    // Draw barrel parts (origin is now the pivot)
    pCtx.fillStyle = TANK_GUN_METAL_COLOR;
    // Barrel base (drawn "behind" the pivot, connecting to turret)
    pCtx.fillRect(-barrelBaseWidth / 2, 0, barrelBaseWidth, barrelBaseHeight); 
    // Main barrel (drawn "in front" of the pivot, extending "upwards" in local rotated coords)
    pCtx.fillRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);

    // Muzzle Brake (simple thicker end)
    const muzzleWidth = barrelWidth * 1.5;
    const muzzleLength = 15 * s;
    pCtx.fillRect(-muzzleWidth / 2, -barrelLength - muzzleLength, muzzleWidth, muzzleLength);

    // Highlights on barrel
    pCtx.fillStyle = TANK_GUN_HIGHLIGHT_COLOR;
    pCtx.fillRect(-barrelWidth / 2 + 2*s, -barrelLength, barrelWidth - 4*s, 10*s); // Highlight at the tip
    pCtx.fillRect(-2*s, -barrelLength * 0.8 , 4*s, barrelLength * 0.8); // Center line highlight

    // Outlines for definition
    pCtx.strokeStyle = TANK_OUTLINE_COLOR;
    pCtx.lineWidth = 1.5 * s;
    pCtx.strokeRect(-barrelBaseWidth / 2, 0, barrelBaseWidth, barrelBaseHeight);
    pCtx.strokeRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);
    pCtx.strokeRect(-muzzleWidth / 2, -barrelLength - muzzleLength, muzzleWidth, muzzleLength);
    pCtx.restore();
}

function drawTankBodyHighlights(pCtx, pX, pY, pScale) {
    const s = pScale;
    // Approximate Y positions for highlights relative to the tank's pY
    const bodyHeight = 190 * s; // From drawTankBody
    const bodyTopY = pY - bodyHeight / 2;
    const turretBaseYOffset = -15 * s; // From drawTankTurret

    pCtx.save();
    pCtx.fillStyle = TANK_METALLIC_REFLECTION_COLOR;
    pCtx.globalAlpha = 0.7; // Semi-transparent highlights

    // Small glint on turret edge
    pCtx.beginPath();
    pCtx.arc(pX + 40*s, pY + turretBaseYOffset - 20*s, 4*s, 0, Math.PI*2);
    pCtx.fill();

    // Glint on body corner
    pCtx.beginPath();
    pCtx.arc(pX - 60*s, bodyTopY + 10*s, 5*s, 0, Math.PI*2);
    pCtx.fill();

    pCtx.globalAlpha = 1; // Reset alpha
    pCtx.restore();
}


// --- Main Function to Draw a Single Tank (Called by main game script) ---
function drawCompleteTank(pCtx, tank) {
    if (!pCtx || !tank) {
        // console.error("drawCompleteTank called with invalid context or tank object");
        return;
    }
    pCtx.save(); // Save the current drawing state

    // Call individual part drawing functions in the correct order for layering
    drawTankOuterOutline(pCtx, tank.x, tank.y, tank.scaleFactor);
    drawTankTreads(pCtx, tank.x, tank.y, tank.scaleFactor, tank.treadOffset);
    drawTankBody(pCtx, tank.x, tank.y, tank.scaleFactor);
    drawTankTurret(pCtx, tank.x, tank.y, tank.scaleFactor); // Turret itself doesn't rotate with barrel in this design
    drawTankGunBarrel(pCtx, tank.x, tank.y, tank.scaleFactor, tank.currentBarrelAngle);
    drawTankBodyHighlights(pCtx, tank.x, tank.y, tank.scaleFactor); // Add highlights on top

    pCtx.restore(); // Restore the drawing state
}

// --- Function to Spawn a New Tank Object (Called by main game script) ---
function spawnNewTank(canvasWidth, canvasHeight) {
    const s = TANK_SCALE_FACTOR;
    const tankVisualWidth = 160 * s; // Approximate width for spawning off-screen
    const startFromLeft = Math.random() < 0.5;
    const startX = startFromLeft ? -tankVisualWidth : canvasWidth + tankVisualWidth;
    // Spawn tanks within the middle 70% of the canvas height
    const startY = Math.random() * (canvasHeight * 0.7) + (canvasHeight * 0.15);

    // Return a new tank object with all necessary properties
    return {
        x: startX,
        y: startY,
        speed: 0.6 + Math.random() * 0.4, // Randomize speed slightly
        scaleFactor: TANK_SCALE_FACTOR,
        currentBarrelAngle: TANK_INITIAL_BARREL_ANGLE,
        targetBarrelAngle: TANK_INITIAL_BARREL_ANGLE,
        barrelTurnSpeed: TANK_BARREL_TURN_SPEED,
        barrelMoveTimer: Math.floor(Math.random() * TANK_BARREL_MOVE_INTERVAL), // Stagger initial barrel movement
        barrelMoveInterval: TANK_BARREL_MOVE_INTERVAL,
        treadOffset: 0,
        radius: (140 * s) / 2, // Approximate radius based on body width for collision detection
        type: 'tank' // Identifier for this enemy type
    };
}

// --- Function to Update a Single Tank's Internal Animations (Called by main game script) ---
// Movement (x, y) is handled by the main game script's updateTanks_main function.
function updateSingleTankAnimations(tank, isSlowMoActiveGame) {
    if (!tank) return;
    const currentSpeedMultiplier = isSlowMoActiveGame ? 0.4 : 1.0; // Respect slow-motion

    // 1. Update tank's barrel animation
    tank.barrelMoveTimer++;
    if (tank.barrelMoveTimer >= tank.barrelMoveInterval) {
        tank.barrelMoveTimer = 0;
        // New random target angle: -PI/2 is straight up. Sweep 60 deg left/right from this.
        const randomSweep = (Math.random() - 0.5) * (Math.PI * (2/3)); // Range from -PI/3 to +PI/3
        tank.targetBarrelAngle = -Math.PI / 2 + randomSweep;
    }

    // Smoothly turn barrel towards target angle
    let angleDiff = tank.targetBarrelAngle - tank.currentBarrelAngle;
    // Normalize angle difference to find the shortest path for rotation
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    if (Math.abs(angleDiff) > tank.barrelTurnSpeed * currentSpeedMultiplier) {
        tank.currentBarrelAngle += Math.sign(angleDiff) * tank.barrelTurnSpeed * currentSpeedMultiplier;
    } else {
        tank.currentBarrelAngle = tank.targetBarrelAngle; // Snap to target if very close
    }
    // Keep barrel angle within a standard range (e.g., -PI to PI)
    while (tank.currentBarrelAngle > Math.PI) tank.currentBarrelAngle -= 2 * Math.PI;
    while (tank.currentBarrelAngle < -Math.PI) tank.currentBarrelAngle += 2 * Math.PI;

    // 2. Update tank's tread animation
    const TREAD_SEGMENT_HEIGHT_SCALED = (200 * tank.scaleFactor) / 10; // 10 segments
    tank.treadOffset = (tank.treadOffset + TANK_TREAD_ANIMATION_SPEED * currentSpeedMultiplier) % TREAD_SEGMENT_HEIGHT_SCALED;
}

// Note: The main game script (index39.html) will be responsible for:
// - Initializing the 'tanks' array.
// - Calling spawnNewTank() to add tanks to the array.
// - In its game loop, iterating through the 'tanks' array and:
//   - Calling updateSingleTankAnimations() for each tank.
//   - Updating each tank's x, y position (movement logic).
//   - Handling collisions.
//   - Calling drawCompleteTank() for each tank.
