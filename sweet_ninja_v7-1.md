# Sweet Ninja — Requirements Specification

> Source: Sweet Ninja FULL Spec (V-Model based system design)
> Format: ATOMS Import v1.6 (per the importParser.ts rules)

---

## Project Variables

# VAR: target_fps_min
- value: 20
- unit: fps
- description: Minimum sustained frame rate.

# VAR: target_fps_avg
- value: 30
- unit: fps
- description: Target average frame rate.

# VAR: fade_alpha
- value: 0.5
- description: Camera fade alpha applied in apply_fade.

# VAR: brightness_reduction_min
- value: 40
- unit: percent
- description: Minimum brightness reduction for fade.

# VAR: finger_latency_max
- value: 50
- unit: ms
- description: Max coordinate update latency for finger tracking.

# VAR: e2e_latency_max
- value: 100
- unit: ms
- description: Max end-to-end motion-to-response latency.

# VAR: lighting_min
- value: 150
- unit: lux
- description: Minimum ambient lighting for correct operation.

# VAR: face_loss_tolerance
- value: 10
- unit: s
- description: Duration face can be absent without disruption.

# VAR: hand_tracking_null_rate_max
- value: 10
- unit: percent
- description: Max fraction of frames where hand tracker returns null.

# VAR: fruit_points
- value: 1
- description: Points awarded per fruit pop.

# VAR: candy_points
- value: 2
- description: Points awarded per candy pop.

# VAR: index_tip_landmark
- value: 8
- description: MediaPipe landmark index for index finger tip.

---

## Requirements Hierarchy

# REQ: F-01 — Player sees themselves on screen while playing
- tags: perception, rendering
- level: feature
- source: F-01

The player sees themselves on screen while playing. The system shall display a live faded camera feed as the game background.

## TC: AT-01 — End-to-end 2-minute gameplay
- tags: perception, rendering
- source: AT-01
- parents: F-02, F-03, F-04

Preconditions: Fresh launch.
Inputs: 2-minute session ending with a deliberate bomb hit.
Steps: Launch. Pop 5 fruits and 3 candies. Touch a bomb.
Expected: User sees themselves throughout; score updates correctly; game ends on bomb.
Pass/Fail: Pass iff all three conditions observed.

## REQ: SR-01 — Capture live video from webcam
- tags: perception, platform, performance
- level: system
- source: SR-01

The system shall capture live video from the webcam. Sustained frame rate ≥ {target_fps_min} fps.

### TC: ST-01 — Sustained frame rate
- tags: perception, platform, performance
- source: ST-01
- parents: SR-07

Preconditions: Laptop with webcam at 640x480.
Inputs: 60-second gameplay session.
Steps: Launch. Log FPS every second.
Expected: Average FPS ≥ {target_fps_avg} for the full session.
Pass/Fail: Pass iff min(FPS) ≥ {target_fps_min} AND avg(FPS) ≥ {target_fps_avg}.

### REQ: SS-01 — Camera Subsystem acquires faded frames
- tags: perception, platform
- level: subsystem
- source: SS-01

The Camera Subsystem shall acquire frames from the webcam and apply fade preprocessing before forwarding them to downstream consumers.

#### TC: IT-01 — Camera to Hand Tracking pipeline
- tags: perception, platform
- source: IT-01
- parents: SS-03

Preconditions: Webcam connected; hand visible.
Inputs: Live camera stream.
Steps: Start camera. Pass each frame to hand tracker. Log finger coords for 5 seconds.
Expected: Non-null (x, y) for ≥ 90% of frames.
Pass/Fail: Pass iff null-rate ≤ {hand_tracking_null_rate_max}% over 5 seconds.

#### REQ: CAM-01 — open_camera initializes webcam
- tags: perception, platform
- level: subsystem
- source: CAM-01

The open_camera module shall initialize the webcam given a device index and return a capture handle.

##### TC: UT-01 — open_camera returns valid handle
- tags: perception, platform
- source: UT-01

Preconditions: Webcam at device index 0 is connected.
Inputs: device_index = 0.
Steps: Call open_camera(0). Verify returned handle is non-null.
Expected: A usable capture handle is returned.
Pass/Fail: Pass iff handle is non-null AND subsequent read_frame succeeds.

#### REQ: CAM-02 — read_frame grabs one BGR frame
- tags: perception
- level: subsystem
- source: CAM-02

The read_frame module shall read one BGR frame from a given capture handle and return the frame or null on failure.

##### TC: UT-02 — read_frame returns expected shape
- tags: perception
- source: UT-02

Preconditions: Camera opened at 640x480.
Inputs: A valid capture handle.
Steps: Call read_frame(handle). Inspect returned frame shape.
Expected: A BGR frame of shape (480, 640, 3).
Pass/Fail: Pass iff returned array has the expected shape.

#### REQ: CAM-03 — apply_fade dims frame brightness
- tags: perception, rendering
- level: subsystem
- source: CAM-03

The apply_fade module shall reduce brightness of the input frame by the alpha factor (default {fade_alpha}) and return the faded frame.

##### TC: UT-03 — apply_fade halves brightness
- tags: perception, rendering
- source: UT-03
- parents: SR-02

Preconditions: Reference BGR frame with known mean brightness B0.
Inputs: frame, alpha = {fade_alpha}.
Steps: Call apply_fade(frame, {fade_alpha}). Compute mean brightness B1.
Expected: B1 within 5% of {fade_alpha} × B0.
Pass/Fail: Pass iff |B1 − {fade_alpha}·B0| / B0 ≤ 0.05.

## REQ: SR-02 — Render user feed with fading
- tags: rendering
- level: system
- source: SR-02

The system shall render the user feed with a fading effect. Brightness reduction ≥ {brightness_reduction_min}%.

### TC: ST-02 — Background fading mean brightness
- tags: rendering
- source: ST-02

Preconditions: Camera on.
Inputs: N/A.
Steps: Compare raw camera feed vs rendered feed brightness.
Expected: Rendered feed is visibly dimmed.
Pass/Fail: Pass iff mean brightness reduction ≥ {brightness_reduction_min}%.

# REQ: F-02 — Player pops fruits and candies with natural hand motion
- tags: gameplay, perception
- level: feature
- source: F-02

The player pops fruits and candies with natural hand motion. The system shall detect finger slide gestures and remove objects on contact.

## REQ: SR-03 — Track index finger position in real time
- tags: perception, performance
- level: system
- source: SR-03

The system shall track the user's index finger position in real time. Coordinate update latency ≤ {finger_latency_max} ms.

### TC: ST-03 — Slide-to-pop responsiveness
- tags: perception, performance
- source: ST-03
- parents: SR-04

Preconditions: Game running; hand visible.
Inputs: User swipes finger across 5 fruits.
Steps: Swipe. Observe score and object removal.
Expected: All 5 fruits removed; score increases by 5.
Pass/Fail: Pass iff final score == initial + 5 AND no fruit remains.

### REQ: SS-03 — Hand Tracking Subsystem produces finger coordinates
- tags: perception
- level: subsystem
- source: SS-03

The Hand Tracking Subsystem shall produce index-finger coordinates per frame from the video stream.

#### TC: IT-02 — Hand Tracking to Game Logic coordinate flow
- tags: perception
- source: IT-02
- parents: SS-04

Preconditions: Hand tracker producing coordinates; game logic running.
Inputs: Scripted finger path crossing a spawned fruit.
Steps: Spawn one fruit at known location. Move finger across it. Observe game state.
Expected: Fruit is removed; score increments.
Pass/Fail: Pass iff fruit removed AND score == 1 within 1 frame of crossing.

#### REQ: HAND-01 — detect_hand runs landmark model
- tags: perception
- level: subsystem
- source: HAND-01

The detect_hand module shall run the hand landmark model on an input frame and return a list of 21 landmarks when a hand is present.

##### TC: UT-04 — detect_hand returns 21 landmarks
- tags: perception
- source: UT-04

Preconditions: Test frame with a visible open hand.
Inputs: Test frame.
Steps: Call detect_hand(frame). Count returned landmarks.
Expected: 21 landmarks returned.
Pass/Fail: Pass iff len(landmarks) == 21.

#### REQ: HAND-02 — extract_index_tip picks landmark 8
- tags: perception
- level: subsystem
- source: HAND-02

The extract_index_tip module shall return landmark index {index_tip_landmark} from a 21-entry landmark list as an (x, y) tuple.

##### TC: UT-05 — extract_index_tip returns correct coord
- tags: perception
- source: UT-05
- parents: SR-03

Preconditions: Mocked landmark list with 21 entries; entry {index_tip_landmark} = (0.4, 0.6).
Inputs: The mocked landmark list.
Steps: Call extract_index_tip(landmarks).
Expected: Returns (0.4, 0.6).
Pass/Fail: Pass iff returned tuple equals (0.4, 0.6) exactly.

#### REQ: HAND-03 — smooth_trajectory applies low-pass filter
- tags: perception
- level: subsystem
- source: HAND-03

The smooth_trajectory module shall apply a low-pass filter to consecutive finger positions to reduce jitter and return a smoothed (x, y).

##### TC: UT-06 — smooth_trajectory reduces jitter
- tags: perception
- source: UT-06

Preconditions: Previous coord (100, 100); current jittered coord (130, 100).
Inputs: prev = (100, 100), curr = (130, 100).
Steps: Call smooth_trajectory((100, 100), (130, 100)).
Expected: Returned x is strictly between 100 and 130.
Pass/Fail: Pass iff 100 < x_out < 130 AND y_out == 100.

## REQ: SR-04 — Pop objects when finger slides across them
- tags: gameplay, physics
- level: system
- source: SR-04

The system shall remove fruits and candies when the finger slides across them, incrementing score within 1 frame.

### REQ: SS-04 — Game Logic Subsystem manages gameplay
- tags: gameplay, physics, state-machine
- level: subsystem
- source: SS-04

The Game Logic Subsystem shall spawn game objects, detect collisions between the finger and objects, manage the score, and manage the running/over game state.

#### TC: IT-03 — Game Logic to UI rendering
- tags: gameplay, physics, state-machine
- source: IT-03
- parents: SS-05

Preconditions: Game logic emits object list and score.
Inputs: Game state with 3 objects and score = 5.
Steps: Pass state to UI. Render one frame.
Expected: All 3 objects visible; score "5" visible top-right.
Pass/Fail: Pass iff visual inspection confirms all three conditions.

#### REQ: GAME-01 — spawn_object creates game object
- tags: gameplay
- level: subsystem
- source: GAME-01

The spawn_object module shall create a new game object (fruit, candy, or bomb) according to the given spawn rule.

##### TC: UT-07 — spawn_object produces valid object
- tags: gameplay
- source: UT-07

Preconditions: None.
Inputs: spawn_rule = "fruit".
Steps: Call spawn_object("fruit"). Inspect returned object.
Expected: Object has type == "fruit", non-null position, positive radius, positive velocity.
Pass/Fail: Pass iff all four properties hold.

#### REQ: GAME-02 — update_physics advances object motion
- tags: physics
- level: subsystem
- source: GAME-02

The update_physics module shall advance each active object's position by its velocity scaled by dt.

##### TC: UT-08 — update_physics moves objects downward
- tags: physics
- source: UT-08

Preconditions: One object at y = 100 with downward velocity 10 px/frame.
Inputs: objects = [obj], dt = 1.
Steps: Call update_physics([obj], 1).
Expected: Returned object has y == 110.
Pass/Fail: Pass iff y_out == 110.

#### REQ: GAME-03 — check_collision detects finger-over-object
- tags: physics, gameplay
- level: subsystem
- source: GAME-03

The check_collision module shall return the list of objects whose bounding circle contains the finger coordinate.

##### TC: UT-09 — check_collision detects hit
- tags: physics, gameplay
- source: UT-09
- parents: SR-04

Preconditions: One fruit at (100, 100) radius 30.
Inputs: finger = (110, 105).
Steps: Call check_collision(finger, [fruit]).
Expected: Hit list contains the fruit.
Pass/Fail: Pass iff fruit ID is in returned hit list.

##### TC: UT-10 — check_collision ignores distant finger
- tags: physics, gameplay
- source: UT-10
- parents: SR-04

Preconditions: Same fruit at (100, 100) radius 30.
Inputs: finger = (300, 300).
Steps: Call check_collision(finger, [fruit]).
Expected: Hit list is empty.
Pass/Fail: Pass iff returned list length == 0.

#### REQ: GAME-04 — update_score adds points per hit
- tags: gameplay
- level: subsystem
- source: GAME-04

The update_score module shall add points for each hit object: fruit = {fruit_points}, candy = {candy_points}.

##### TC: UT-11 — update_score increments correctly
- tags: gameplay
- source: UT-11
- parents: SR-04

Preconditions: Current score = 0.
Inputs: hit list = [fruit (+{fruit_points}), candy (+{candy_points})].
Steps: Call update_score(0, hits).
Expected: Returns 3.
Pass/Fail: Pass iff returned score == 3.

#### REQ: GAME-05 — check_game_over detects bomb hit
- tags: gameplay, state-machine
- level: subsystem
- source: GAME-05
- parents: SR-05

The check_game_over module shall return true if any hit in the hit list is a bomb, else false.

##### TC: UT-12 — check_game_over triggers on bomb
- tags: gameplay, state-machine
- source: UT-12
- parents: SR-05

Preconditions: None.
Inputs: hit list = [bomb].
Steps: Call check_game_over(hits).
Expected: Returns true.
Pass/Fail: Pass iff returned value is true.

# REQ: F-03 — Bombs end the game to create challenge
- tags: gameplay, state-machine
- level: feature
- source: F-03

Touching a bomb with the finger ends the current game session.

## REQ: SR-05 — End game when finger touches bomb
- tags: gameplay, state-machine
- level: system
- source: SR-05

The system shall halt the game loop within 1 frame of bomb collision and display a game-over overlay.

### TC: ST-04 — Bomb ends game
- tags: gameplay, state-machine
- source: ST-04

Preconditions: Game running.
Inputs: User deliberately touches a bomb.
Steps: Touch bomb.
Expected: Game loop halts; game-over screen appears.
Pass/Fail: Pass iff new objects stop spawning within 1 second.

# REQ: F-04 — Player sees their score at all times
- tags: hmi
- level: feature
- source: F-04

The player sees their current score continuously during gameplay.

## REQ: SR-06 — Display score in top-right corner
- tags: hmi
- level: system
- source: SR-06

The system shall display the current score in the top-right corner of the frame, updated every frame.

### TC: ST-05 — Score display top-right
- tags: hmi
- source: ST-05

Preconditions: Game running.
Inputs: Pop 3 fruits.
Steps: Observe score overlay.
Expected: Overlay reads "3" in top-right corner.
Pass/Fail: Pass iff displayed number matches internal score every frame.

### REQ: SS-05 — UI Subsystem renders overlays
- tags: hmi, rendering
- level: subsystem
- source: SS-05

The UI Subsystem shall render all overlays on the faded video background: active game objects, score text, game-over screen, and a no-face indicator when applicable.

#### REQ: UI-01 — draw_objects blits sprites
- tags: rendering
- level: subsystem
- source: UI-01

The draw_objects module shall composite each active game object onto the given frame at its current position.

##### TC: UT-13 — draw_objects blits three sprites
- tags: rendering
- source: UT-13

Preconditions: Blank 640x480 frame; 3 objects at distinct positions.
Inputs: frame, objects = [obj1, obj2, obj3].
Steps: Call draw_objects(frame, objects). Count visibly changed regions.
Expected: 3 distinct rendered regions on the output frame.
Pass/Fail: Pass iff 3 distinct non-background regions.

#### REQ: UI-02 — draw_score renders score text
- tags: hmi, rendering
- level: subsystem
- source: UI-02

The draw_score module shall render the score value as text in the top-right corner of the given frame.

##### TC: UT-14 — draw_score places text top-right
- tags: hmi, rendering
- source: UT-14
- parents: SR-06

Preconditions: Blank 640x480 frame.
Inputs: score = 42.
Steps: Call draw_score(frame, 42). Inspect pixel region x in [500, 640], y in [0, 50].
Expected: Non-background pixels in top-right region; none in top-left.
Pass/Fail: Pass iff top-right has text pixels AND top-left does not.

#### REQ: UI-03 — draw_game_over renders end-screen overlay
- tags: hmi, state-machine
- level: subsystem
- source: UI-03

The draw_game_over module shall render the game-over overlay on the given frame.

---

## Test Cases

##### TC: UT-15 — draw_game_over renders visible overlay
- tags: hmi, state-machine
- source: UT-15

Preconditions: Blank 640x480 frame.
Inputs: frame.
Steps: Call draw_game_over(frame). Inspect the centre region.
Expected: Visually distinct overlay covers at least the centre quarter of the frame.
Pass/Fail: Pass iff centre quarter differs from background.

# REQ: F-05 — Game responds instantly with no perceptible lag
- tags: performance
- level: feature
- source: F-05

The player perceives the game as responsive. End-to-end latency from motion to on-screen response shall stay below human perception threshold.

## TC: AT-02 — Perceived responsiveness rating
- tags: performance
- source: AT-02

Preconditions: Fresh launch.
Inputs: Natural hand motion.
Steps: User rates lag on a 1–5 scale.
Expected: User rates ≥ 4 ("feels instant").
Pass/Fail: Pass iff rating ≥ 4.

## REQ: SR-07 — End-to-end latency below threshold
- tags: performance
- level: system
- source: SR-07

The system shall maintain end-to-end latency from motion to on-screen response ≤ {e2e_latency_max} ms.

### TC: ST-08 — End-to-end latency measurement
- tags: performance
- source: ST-08

Preconditions: Camera calibrated; timestamped frame logging enabled.
Inputs: 50 deliberate finger taps on known-position targets.
Steps: For each tap, record the frame timestamp of the crossing and of the pop. Compute per-tap latency.
Expected: Mean latency ≤ {e2e_latency_max} ms.
Pass/Fail: Pass iff mean(latency) ≤ {e2e_latency_max} AND p95(latency) ≤ 150 ms.

# REQ: F-06 — Game works in normal indoor lighting
- tags: perception, robustness
- level: feature
- source: F-06

The game operates correctly in typical indoor ambient lighting without requiring special setup.

## TC: AT-03 — Works in typical room lighting
- tags: perception, robustness
- source: AT-03

Preconditions: Ordinary indoor lighting.
Inputs: 1-minute session.
Steps: Play normally.
Expected: Game is fully playable.
Pass/Fail: Pass iff user confirms playable without adjusting lights.

## REQ: SR-08 — Operate at ≥ 150 lux ambient lighting
- tags: perception, robustness
- level: system
- source: SR-08

The system shall operate correctly under ambient lighting ≥ {lighting_min} lux.

### TC: ST-06 — Low-light robustness
- tags: perception, robustness
- source: ST-06

Preconditions: Room lit at {lighting_min} lux measured.
Inputs: 30-second session.
Steps: Play under {lighting_min} lux.
Expected: Hand tracking continues; occasional drops acceptable.
Pass/Fail: Pass iff game remains playable AND no crash.

# REQ: F-07 — Game keeps running if face briefly leaves view
- tags: robustness, state-machine
- level: feature
- source: F-07

The game continues running without interruption if the player's face briefly leaves the camera view.

---

## System Requirements

## TC: AT-04 — Face briefly leaves view
- tags: robustness, state-machine
- source: AT-04

Preconditions: Game running.
Inputs: User turns away for 3 seconds and returns.
Steps: Turn away. Return.
Expected: Game keeps running; user resumes play without restart.
Pass/Fail: Pass iff session is not interrupted.

## REQ: SR-09 — Do not crash when no face detected
- tags: robustness, state-machine
- level: system
- source: SR-09

The system shall continue looping without crashing when no face is detected. A visible indicator is optional.

---

## Subsystem Requirements

### TC: ST-07 — No-face robustness
- tags: robustness, state-machine
- source: ST-07

Preconditions: Game running.
Inputs: User covers face for {face_loss_tolerance} seconds.
Steps: Cover face. Uncover.
Expected: Game keeps running; resumes normal detection.
Pass/Fail: Pass iff no crash AND gameplay state preserved.

### REQ: SS-02 — Face Detection Subsystem non-blocking presence check
- tags: perception, robustness
- level: subsystem
- source: SS-02

The Face Detection Subsystem shall run a non-blocking presence check and expose a present/absent flag to the UI Subsystem.

#### TC: IT-04 — Face Detection to UI warning
- tags: perception, robustness
- source: IT-04
- parents: SS-05, SR-09

Preconditions: Game running, face currently visible.
Inputs: User leaves the frame.
Steps: Play for 2 s. Exit frame for 3 s. Return.
Expected: Game keeps running; optional no-face indicator appears during absence.
Pass/Fail: Pass iff no crash occurs AND gameplay continues.
