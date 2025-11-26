0 FILE Searchers_Rider_Grounded_SpinFix.mpd
0 Name: Searchers Rider Grounded (Bodies Facing TV)
0 Author: Grace Balanced Architect
0 !LDRAW_ORG Model
0 !LICENCE Redistributable under CCAL version 2.0
0 BFC CERTIFY CCW

0 // ============================================================
0 // MENTO LIGHTING MANIFEST (The Searchers Contrast)
0 // ============================================================

0 // LIGHT 1: THE DESERT SUN (Exterior Key)
0 // High intensity, slightly warm, casting long shadows through the door.
0 // Positioned high and behind the Horse.
0 !MENTO LIGHT "Desert Sun" TYPE SUN POS 400 -1000 400 TGT 0 0 0 COLOR #FFF8E7 INTENSITY 1.8 SHADOWS TRUE

0 // LIGHT 2: THE TV GLOW (Interior Key)
0 // Cool blue, emanating from the TV Frame location, illuminating the family's faces.
0 !MENTO LIGHT "TV Glow" TYPE AREA POS 0 -40 250 TGT 0 -40 0 COLOR #AADDFF INTENSITY 2.5 DECAY 200

0 // LIGHT 3: CAVE FILL (Interior Ambience)
0 // Very low purple/dark fill to keep the interior shadows from being pure black.
0 !MENTO LIGHT "Cave Fill" TYPE POINT POS 0 -100 0 COLOR #110022 INTENSITY 0.3

0 // ============================================================
0 // MENTO CAMERA TRACK (The Shot List)
0 // ============================================================

0 // SHOT 1: THE RIDER (Establishing)
0 // Low angle, behind Homer's right shoulder, looking past him into the house.
0 !MENTO SHOT "The Rider" POS 280 -80 180 TGT 0 -40 20 LENS 50

0 // SHOT 2: THE AUDIENCE (Reverse Angle)
0 // The POV of the TV. We see the family staring back at us, bathed in blue light.
0 !MENTO SHOT "The Audience" POS 0 -40 200 TGT 0 -40 20 LENS 35

0 // SHOT 3: THE THRESHOLD (The Classic Ford Shot)
0 // Wide shot from deep outside, framing the lit interior through the dark door.
0 !MENTO SHOT "The Threshold" POS 100 -60 400 TGT 0 -40 0 LENS 85

0 // SHOT 4: THE DISCONNECT (Overhead)
0 // Top-down view showing the wall separating the Rider from the Family.
0 !MENTO SHOT "The Disconnect" POS 100 -400 100 TGT 50 0 100 LENS 40

0 // ============================================================
0 // ZONE 1: THE GROUND & STRUCTURE
0 // ============================================================

0 // THE RUG
1 16 0 8 0 1 0 0 0 1 0 0 0 1 2359p02.dat

0 // THE COUCH BACK (Rotated -90 deg)
1 13 0 -40 20 0 0 -1 0 1 0 1 0 0 22972.dat

0 // THE SIDE WALL
1 13 120 -40 -40 0 0 1 -1 0 0 0 0 0 22972.dat

0 // PORTAL 1: THE TV FRAME
1 26 220 -152 -130 0.707 0 -0.707 0 1 0 0.707 0 0.707 2332.dat

0 // PORTAL 2: THE MAIN DOOR
1 0 0 -144 230 1 0 0 0 1 0 0 0 1 2332.dat

0 // ============================================================
0 // ZONE 2: THE COUCH (Seating)
0 // ============================================================
1 484 0 -8 40 1 0 0 0 1 0 0 0 1 3001.dat
1 484 30 -8 40 1 0 0 0 1 0 0 0 1 3001.dat
1 484 -30 -8 40 1 0 0 0 1 0 0 0 1 3001.dat
1 484 0 -32 20 1 0 0 0 1 0 0 0 1 3001.dat
1 484 30 -32 20 1 0 0 0 1 0 0 0 1 3001.dat
1 484 -30 -32 20 1 0 0 0 1 0 0 0 1 3001.dat
1 484 50 -24 30 0 0 1 0 1 0 -1 0 0 3003.dat
1 484 -50 -24 30 0 0 1 0 1 0 -1 0 0 3003.dat

0 // ============================================================
0 // ZONE 3: THE CAST (Fully Spun to Face TV)
0 // ============================================================
0 // All rotation matrices set to -1 0 0 0 1 0 0 0 -1 (Facing Back/+Z)

0 // --- MARGE (Robot Chef) ---
0 // Hips
1 16 -20 -38 50 -1 0 0 0 1 0 0 0 -1 parts/10679bp01.dat
0 // Torso (Flipped)
1 16 -20 -60 40 -1 0 0 0 1 0 0 0 -1 parts/76382p89.dat
0 // Head
1 16 -20 -64 40 -1 0 0 0 1 0 0 0 -1 parts/15522p01.dat
0 // Hair
1 16 -20 -84 40 -1 0 0 0 1 0 0 0 -1 parts/24073.dat
0 // Right Arm (Now on \"Left\" side X-wise because of rotation)
1 14 -29 -52 40 -1 0 0 0 1 0 0 0 -1 3818.dat
0 // Left Arm
1 14 -11 -52 40 -1 0 0 0 1 0 0 0 -1 3819.dat
0 // Hands
1 14 -29 -40 50 -1 0 0 0 0 -1 0 -1 0 3820.dat
1 14 -11 -40 50 -1 0 0 0 0 -1 0 -1 0 3820.dat

0 // --- BART (Chainmail Knight) ---
0 // Leaning posture, Body matched to Head
0 // Hips
1 16 -50 -56 30 -0.9 0 0.4 0 1 0 -0.4 0 -0.9 parts/16709p0e.dat
0 // Torso (Matched to Hips)
1 16 -50 -78 30 -0.9 0 0.4 0 1 0 -0.4 0 -0.9 parts/76382p0006.dat
0 // Head
1 16 -50 -82 30 -0.9 0 0.4 0 1 0 -0.4 0 -0.9 parts/15523p01.dat
0 // Right Arm
1 14 -59 -70 34 -0.9 0 0.4 0 1 0 -0.4 0 -0.9 3818.dat
0 // Left Arm
1 14 -41 -70 26 -0.9 0 0.4 0 1 0 -0.4 0 -0.9 3819.dat
0 // Hands
1 14 -59 -60 44 -0.9 0 0.4 0 0 -1 0 -1 0 3820.dat
1 14 -41 -60 36 -0.9 0 0.4 0 0 -1 0 -1 0 3820.dat

0 // --- LISA (Hawaiian Tourist) ---
0 // Hips
1 16 20 -28 40 -1 0 0 0 1 0 0 0 -1 parts/73200bp42.dat
0 // Torso (Flipped)
1 16 20 -50 40 -1 0 0 0 1 0 0 0 -1 parts/16360p5i.dat
0 // Head
1 16 20 -54 40 -1 0 0 0 1 0 0 0 -1 parts/15524p01.dat
0 // Right Arm
1 14 11 -42 40 -1 0 0 0 1 0 0 0 -1 3818.dat
0 // Left Arm
1 14 29 -42 40 -1 0 0 0 1 0 0 0 -1 3819.dat
0 // Hands
1 14 11 -30 50 -1 0 0 0 0 -1 0 -1 0 3820.dat
1 14 29 -30 50 -1 0 0 0 0 -1 0 -1 0 3820.dat

0 // --- MAGGIE (The Homer Clone) ---
0 // Body (Flipped to face TV)
1 16 50 -38 50 -1 0 0 0 1 0 0 0 -1 parts/3815bpde.dat
0 // Head
1 16 50 -64 40 -1 0 0 0 1 0 0 0 -1 parts/15525p02.dat
0 // Accessory
1 16 50 -84 38 -1 0 0 0 1 0 0 0 -1 parts/30114c01.dat

0 // ============================================================
0 // ZONE 4: EXTERIOR (Grounded)
0 // ============================================================

0 // THE HORSE
1 6 200 -56 100 -1 0 0 0 1 0 0 0 -1 4493c00.dat

0 // HOMER (The Rider)
1 16 200 -116 100 -1 0 0 0 1 0 0 0 -1 parts/3815bpde.dat
1 16 190 -104 100 -1 0 0 0 1 0 0 0 -1 parts/3817cpbc.dat
1 16 210 -104 100 -1 0 0 0 1 0 0 0 -1 parts/3816cpbc.dat
1 16 200 -148 100 -1 0 0 0 1 0 0 0 -1 parts/76382p6w.dat
1 16 200 -152 100 1 0 0 0 1 0 0 0 1 parts/15527p02.dat
1 16 200 -172 100 1 0 0 0 1 0 0 0 1 parts/30114c01.dat

0 // THE TREE
1 16 140 0 220 1 0 0 0 1 0 0 0 1 u9078s02.dat

0 NOFILE