# Sweet Ninja
## V-Model Based System Design, Subsystems, and Traceability

---

## 1. Document Purpose

This document specifies the design, implementation, and verification of the **Sweet Ninja** system using the **V-Model** software engineering methodology. Every development phase on the left side of the V has a corresponding verification or validation phase on the right side, ensuring full bidirectional traceability from user needs to executable tests.

---

## 2. System Overview

**Sweet Ninja** is a camera-based hand-gesture game in which the user appears in a faded webcam background and interacts with falling fruits, candies, and bombs using a **slide-to-pop** hand motion. The system demonstrates real-time computer vision, gesture recognition, and reactive game logic.

---

## 3. V-Model Methodology

The V-Model enforces that **each development phase has a matching test phase** on the opposite arm of the V. The left arm defines the system progressively (from abstract user needs to concrete code); the right arm verifies that the built system matches each of those definitions.

### 3.1 V-Model Mapping (Phase-to-Test)

| # | Development Phase (Left Arm) | Artifact Produced        | Corresponding Test Phase (Right Arm) | Section |
|---|------------------------------|--------------------------|--------------------------------------|---------|
| 1 | Requirement Gathering        | User Requirements (UR)   | Acceptance Testing (AT)              | §4 ↔ §14 |
| 2 | System Analysis              | System Requirements (SR) | System Testing (ST)                  | §5 ↔ §13 |
| 3 | Software (Architectural) Design | Subsystem Specs (SS)  | Integration Testing (IT)             | §6 ↔ §12 |
| 4 | Module Design                | Module Specs (MD)        | Unit Testing (UT)                    | §7 ↔ §11 |
| 5 | Coding / Implementation      | Source Code              | Execution & Debugging                | §8 ↔ §10 |

### 3.2 Verification vs. Validation

- **Verification (left arm → right arm):** *"Are we building the product right?"* — each artifact is tested against its own specification.
- **Validation (overall):** *"Are we building the right product?"* — the finished system satisfies the original user requirements (Acceptance Testing).

---

## 4. Phase 1 — Requirement Gathering (User Requirements)

User requirements are written from the *player's* perspective and express needs, not implementation.

| UR ID | User Requirement | Priority | Source |
|-------|------------------|----------|--------|
| UR-1  | The player wants to see themselves on screen while playing. | High | Gameplay immersion |
| UR-2  | The player wants to pop fruits and candies with natural hand motion. | High | Core gameplay |
| UR-3  | The player wants bombs to end the game to create challenge. | High | Core gameplay |
| UR-4  | The player wants to see their score at all times. | High | Feedback loop |
| UR-5  | The player wants the game to respond instantly (no perceptible lag). | High | Usability |
| UR-6  | The player wants the game to work in normal indoor lighting. | Medium | Usability |
| UR-7  | The player wants the game to keep running if their face briefly leaves view. | Medium | Robustness |

→ These requirements are validated in **§14 Acceptance Testing**.

---

## 5. Phase 2 — System Analysis (System Requirements)

System requirements translate user needs into **testable, measurable** statements.

| SR ID | System Requirement | Derived From | Measurable Criterion |
|-------|-------------------|--------------|----------------------|
| SR-1  | The system shall capture live video from the webcam. | UR-1 | FPS ≥ 20 sustained |
| SR-2  | The system shall render the user feed with a fading/dimming effect. | UR-1 | Brightness reduction ≥ 40% |
| SR-3  | The system shall track the user's index finger position in real time. | UR-2 | Coordinate update latency ≤ 50 ms |
| SR-4  | The system shall pop fruits and candies when the finger slides across them. | UR-2 | Object removed + score incremented within 1 frame |
| SR-5  | The system shall end the game when the finger touches a bomb. | UR-3 | Game loop halts within 1 frame of collision |
| SR-6  | The system shall display the current score in the top-right corner. | UR-4 | Score visible and updated each frame |
| SR-7  | The system shall maintain end-to-end latency ≤ 100 ms from motion to on-screen response. | UR-5 | Measured via timestamped frames |
| SR-8  | The system shall operate correctly under ambient lighting ≥ 150 lux. | UR-6 | Functional test at 150 lux |
| SR-9  | The system shall not crash if no face is detected. | UR-7 | Continues looping with a warning only |

→ These requirements are verified in **§13 System Testing**.

---

## 6. Phase 3 — Software (Architectural) Design

### 6.1 High-Level Architecture

```
          ┌──────────────────┐
          │ Camera Subsystem │  (captures frames, applies fade)
          └────────┬─────────┘
                   │ frame
        ┌──────────┼────────────┐
        ▼          ▼            ▼
 ┌────────────┐ ┌────────────┐ ┌──────────────┐
 │ Face Detect│ │ Hand Track │ │ UI Subsystem │
 └─────┬──────┘ └─────┬──────┘ └──────▲───────┘
       │  status      │ finger (x,y)   │ overlay
       └──────┬───────┴────────────────┘
              ▼
       ┌───────────────┐
       │ Game Logic    │ (spawning, collision, scoring, game-over)
       └───────────────┘
```

### 6.2 Subsystems

| ID   | Subsystem               | Responsibility |
|------|-------------------------|----------------|
| SS-1 | Camera Subsystem        | Acquire frames, apply fade preprocessing |
| SS-2 | Face Detection Subsystem| Verify user presence (non-blocking) |
| SS-3 | Hand Tracking Subsystem | Produce index-finger coordinates per frame |
| SS-4 | Game Logic Subsystem    | Spawn objects, detect collisions, manage score and game state |
| SS-5 | UI Subsystem            | Render overlay: objects, score, game-over screen |

### 6.3 Subsystem Interfaces

| Interface | Producer → Consumer | Data |
|-----------|---------------------|------|
| IF-1 | Camera → all | Video frame (BGR image) |
| IF-2 | Hand Tracking → Game Logic | (x, y, timestamp) |
| IF-3 | Face Detection → UI | present/absent flag |
| IF-4 | Game Logic → UI | object list, score, state |

→ Verified in **§12 Integration Testing**.

---

## 7. Phase 4 — Module Design

Each subsystem is decomposed into **modules** (smallest independently testable units).

### 7.1 Camera Subsystem Modules

| MD ID | Module        | Function signature (conceptual) | Inputs | Outputs |
|-------|---------------|----------------------------------|--------|---------|
| MD-1.1 | `open_camera()` | Initialize webcam | device index | capture handle |
| MD-1.2 | `read_frame()` | Grab one frame | capture handle | frame or null |
| MD-1.3 | `apply_fade()` | Dim frame brightness | frame, alpha | faded frame |

### 7.2 Hand Tracking Subsystem Modules

| MD ID | Module | Function | Inputs | Outputs |
|-------|--------|----------|--------|---------|
| MD-2.1 | `detect_hand()` | Run landmark model | frame | landmarks |
| MD-2.2 | `extract_index_tip()` | Pick landmark 8 | landmarks | (x, y) |
| MD-2.3 | `smooth_trajectory()`| Map and clamp coords | landmarks | (x, y) in range [0, GAME_DIM] |

### 7.3 Game Logic Subsystem Modules

| MD ID | Module | Function | Inputs | Outputs |
|-------|--------|----------|--------|---------|
| MD-3.1 | `spawn_object()` | Create fruit/candy/bomb | spawn rule | object |
| MD-3.2 | `update_physics()` | Move objects down | objects, Δt | updated objects (reduced gravity for accessibility) |
| MD-3.3 | `check_collision()` | Finger-vs-object hit test | finger (x, y), objects | hit list |
| MD-3.4 | `update_score()` | Add points | hit list | new score |
| MD-3.5 | `check_game_over()` | Detect bomb hit | hit list | bool |

### 7.4 UI Subsystem Modules

| MD ID | Module | Function | Inputs | Outputs |
|-------|--------|----------|--------|---------|
| MD-4.1 | `draw_objects()` | Blit sprites | frame, objects | frame |
| MD-4.2 | `draw_score()` | Render score top-right | frame, score | frame |
| MD-4.3 | `draw_game_over()` | Show end screen | frame | frame |

→ Verified in **§11 Unit Testing**.

---

## 8. Phase 5 — Implementation (Coding)

Implementation follows the module designs in §7. Target environment:

- Language: Python 3.x
- Libraries: OpenCV (camera + UI), MediaPipe (hand tracking), NumPy (math)
- Frame rate target: 30 FPS, minimum 20 FPS (per SR-1)

Code is organized one file per subsystem (`camera.py`, `hand_tracking.py`, `game_logic.py`, `ui.py`, `main.py`).

---

## 9. IEEE-Style Test Case Template

Every test case from §11 onward uses this format:

| Field | Description |
|-------|-------------|
| **Test ID** | Unique identifier |
| **Traces to** | Requirement / module under test |
| **Preconditions** | System state before the test |
| **Inputs** | Data or actions supplied to the unit |
| **Steps** | Numbered procedure |
| **Expected Result** | Observable outcome if the system is correct |
| **Pass / Fail Criterion** | Exact rule used to decide pass or fail |
| **Actual Result** | *(filled in during execution)* |
| **Status** | Pass / Fail / Blocked |

---

## 10. Phase 5 Verification — Execution & Debugging

Before formal testing begins, each module is executed in isolation with a smoke test. Any crash, exception, or compile error must be resolved before moving to §11. This is the informal developer-level check that corresponds to the bottom of the V-Model.

---

## 11. Unit Testing (↔ Module Design, §7)

Unit tests verify individual modules in isolation using mocks or fixtures.

### UT-1 — `apply_fade()` reduces brightness

| Field | Value |
|-------|-------|
| Traces to | MD-1.3, SR-2 |
| Preconditions | A reference BGR frame of known mean brightness B₀ is loaded. |
| Inputs | frame = reference frame; alpha = 0.5 |
| Steps | 1. Call `apply_fade(frame, 0.5)`. <br> 2. Compute mean brightness B₁ of output. |
| Expected Result | B₁ ≈ 0.5 × B₀ (±5%). |
| Pass / Fail Criterion | Pass if |B₁ − 0.5·B₀| / B₀ ≤ 0.05, else Fail. |

### UT-2 — `extract_index_tip()` returns correct landmark

| Field | Value |
|-------|-------|
| Traces to | MD-2.2, SR-3 |
| Preconditions | A mocked landmark list with 21 entries is prepared; entry 8 = (0.4, 0.6). |
| Inputs | The mocked landmark list. |
| Steps | 1. Call `extract_index_tip(landmarks)`. |
| Expected Result | Returns (0.4, 0.6). |
| Pass / Fail Criterion | Pass if returned tuple equals (0.4, 0.6) exactly. |

### UT-3 — `check_collision()` detects finger-over-object

| Field | Value |
|-------|-------|
| Traces to | MD-3.3, SR-4 |
| Preconditions | One fruit object at (100, 100) with radius 75. |
| Inputs | finger = (120, 120) |
| Steps | 1. Call `check_collision(finger, [fruit])`. |
| Expected Result | Hit list contains the fruit. |
| Pass / Fail Criterion | Pass if fruit ID is in returned hit list; Fail otherwise. |

### UT-4 — `check_collision()` ignores distant finger

| Field | Value |
|-------|-------|
| Traces to | MD-3.3, SR-4 |
| Preconditions | Same fruit at (100, 100) radius 75. |
| Inputs | finger = (300, 300) |
| Steps | 1. Call `check_collision(finger, [fruit])`. |
| Expected Result | Hit list is empty. |
| Pass / Fail Criterion | Pass if returned list length == 0. |

### UT-5 — `update_score()` increments correctly

| Field | Value |
|-------|-------|
| Traces to | MD-3.4, SR-4 |
| Preconditions | Current score = 0. |
| Inputs | hit list = [fruit (+1), candy (+2)] |
| Steps | 1. Call `update_score(0, hits)`. |
| Expected Result | Returns 3. |
| Pass / Fail Criterion | Pass iff returned score == 3. |

### UT-6 — `check_game_over()` triggers on bomb

| Field | Value |
|-------|-------|
| Traces to | MD-3.5, SR-5 |
| Preconditions | None. |
| Inputs | hit list = [bomb] |
| Steps | 1. Call `check_game_over(hits)`. |
| Expected Result | Returns True. |
| Pass / Fail Criterion | Pass iff returned value is True. |

### UT-7 — `draw_score()` places text in top-right

| Field | Value |
|-------|-------|
| Traces to | MD-4.2, SR-6 |
| Preconditions | Blank 640×480 frame. |
| Inputs | score = 42 |
| Steps | 1. Call `draw_score(frame, 42)`. <br> 2. Inspect pixel region x ∈ [500, 640], y ∈ [0, 50]. |
| Expected Result | Non-background pixels exist in the top-right region; none in the top-left. |
| Pass / Fail Criterion | Pass iff top-right region has text pixels AND top-left does not. |

---

## 12. Integration Testing (↔ Software Design, §6)

Integration tests verify that subsystems communicate correctly across the interfaces defined in §6.3.

### IT-1 — Camera → Hand Tracking pipeline

| Field | Value |
|-------|-------|
| Traces to | IF-1, SS-1 + SS-3 |
| Preconditions | Webcam connected; hand visible in frame. |
| Inputs | Live camera stream. |
| Steps | 1. Start camera. <br> 2. Pass each frame to hand tracker. <br> 3. Log (x, y) of index tip for 5 seconds. |
| Expected Result | Non-null (x, y) returned for ≥ 90% of frames. |
| Pass / Fail Criterion | Pass iff null-rate ≤ 10% over the 5-second window. |

### IT-2 — Hand Tracking → Game Logic coordinate flow

| Field | Value |
|-------|-------|
| Traces to | IF-2 |
| Preconditions | Hand tracker producing coordinates; game logic running. |
| Inputs | Scripted finger path crossing a spawned fruit. |
| Steps | 1. Spawn one fruit at known location. <br> 2. Move finger across it. <br> 3. Observe game state. |
| Expected Result | Fruit is removed; score increments. |
| Pass / Fail Criterion | Pass iff fruit removed AND score == 1 within 1 frame of crossing. |

### IT-3 — Game Logic → UI rendering

| Field | Value |
|-------|-------|
| Traces to | IF-4 |
| Preconditions | Game logic emits object list and score. |
| Inputs | Game state with 3 objects and score = 5. |
| Steps | 1. Pass state to UI. <br> 2. Render one frame. |
| Expected Result | All 3 objects visible; score "5" visible top-right. |
| Pass / Fail Criterion | Pass iff visual inspection confirms all three conditions. |

### IT-4 — Face Detection → UI warning

| Field | Value |
|-------|-------|
| Traces to | IF-3, SR-9 |
| Preconditions | Game running, face currently visible. |
| Inputs | User leaves the frame. |
| Steps | 1. Play for 2 s. <br> 2. Exit frame for 3 s. <br> 3. Return. |
| Expected Result | Game keeps running; optional "No face" indicator appears during absence. |
| Pass / Fail Criterion | Pass iff no crash occurs AND gameplay continues. |

---

## 13. System Testing (↔ System Requirements, §5)

System tests verify the full integrated system against each SR.

### ST-1 — Sustained frame rate (SR-1, SR-7)

| Field | Value |
|-------|-------|
| Preconditions | Laptop with webcam; resolution 640×480. |
| Inputs | 60-second gameplay session. |
| Steps | 1. Launch game. <br> 2. Log FPS every second. |
| Expected Result | Average FPS ≥ 20 for the full session. |
| Pass / Fail Criterion | Pass iff min(FPS) ≥ 20 AND avg(FPS) ≥ 25. |

### ST-2 — Background fading (SR-2)

| Field | Value |
|-------|-------|
| Preconditions | Camera on. |
| Inputs | N/A. |
| Steps | 1. Compare raw camera feed vs. rendered feed brightness. |
| Expected Result | Rendered feed is visibly dimmed. |
| Pass / Fail Criterion | Pass iff mean brightness reduction ≥ 40%. |

### ST-3 — Slide-to-pop responsiveness (SR-3, SR-4)

| Field | Value |
|-------|-------|
| Preconditions | Game running; hand visible. |
| Inputs | User swipes finger across 5 fruits. |
| Steps | 1. Swipe. <br> 2. Observe score and object removal. |
| Expected Result | All 5 fruits removed; score increases by 5. |
| Pass / Fail Criterion | Pass iff final score == initial + 5 AND no fruit remains on-screen. |

### ST-4 — Bomb ends game (SR-5)

| Field | Value |
|-------|-------|
| Preconditions | Game running. |
| Inputs | User deliberately touches a bomb. |
| Steps | 1. Touch bomb. |
| Expected Result | Game loop halts; "Game Over" screen appears. |
| Pass / Fail Criterion | Pass iff new objects stop spawning within 1 second. |

### ST-5 — Score display (SR-6)

| Field | Value |
|-------|-------|
| Preconditions | Game running. |
| Inputs | Pop 3 fruits. |
| Steps | 1. Observe score overlay. |
| Expected Result | Overlay reads "3" in top-right corner. |
| Pass / Fail Criterion | Pass iff displayed number matches internal score every frame. |

### ST-6 — Low-light robustness (SR-8)

| Field | Value |
|-------|-------|
| Preconditions | Room lit at 150 lux (measured). |
| Inputs | 30-second session. |
| Steps | 1. Play under 150 lux. |
| Expected Result | Hand tracking continues; occasional drops acceptable. |
| Pass / Fail Criterion | Pass iff game remains playable AND no crash. |

### ST-7 — No-face robustness (SR-9)

| Field | Value |
|-------|-------|
| Preconditions | Game running. |
| Inputs | User covers face for 10 s. |
| Steps | 1. Cover face. <br> 2. Uncover. |
| Expected Result | Game keeps running; resumes normal detection. |
| Pass / Fail Criterion | Pass iff no crash AND gameplay state preserved. |

---

## 14. Acceptance Testing (↔ User Requirements, §4)

Acceptance testing is performed by the user (or proxy). It validates that the product meets the **user's** needs, not just the engineers' specs.

### AT-1 — End-to-end gameplay (UR-1, UR-2, UR-3, UR-4)

| Field | Value |
|-------|-------|
| Preconditions | Fresh launch of the game. |
| Inputs | 2-minute play session ending with a deliberate bomb hit. |
| Steps | 1. Launch. <br> 2. Pop at least 5 fruits and 3 candies. <br> 3. Touch a bomb. |
| Expected Result | User sees themselves throughout; score updates correctly; game ends on bomb. |
| Pass / Fail Criterion | Pass iff all three conditions observed by the user. |

### AT-2 — Perceived responsiveness (UR-5)

| Field | Value |
|-------|-------|
| Preconditions | Fresh launch. |
| Inputs | Natural hand motion. |
| Steps | 1. Ask the user to rate lag on a 1–5 scale. |
| Expected Result | User rates ≥ 4 ("feels instant"). |
| Pass / Fail Criterion | Pass iff user rating ≥ 4. |

### AT-3 — Works in typical room lighting (UR-6)

| Field | Value |
|-------|-------|
| Preconditions | Ordinary indoor lighting. |
| Inputs | 1-minute session. |
| Steps | 1. Play normally. |
| Expected Result | Game is fully playable. |
| Pass / Fail Criterion | Pass iff user confirms playable without adjusting lights. |

### AT-4 — Face briefly leaves view (UR-7)

| Field | Value |
|-------|-------|
| Preconditions | Game running. |
| Inputs | User turns away for 3 s and returns. |
| Steps | 1. Turn away. <br> 2. Return. |
| Expected Result | Game keeps running; user resumes play without restart. |
| Pass / Fail Criterion | Pass iff session is not interrupted. |

---

## 15. Full Bidirectional Traceability Matrix

Every row reads across the V from left arm to right arm.

| User Req | System Req       | Subsystem(s)         | Module(s)           | Unit Test(s)  | Integration Test(s) | System Test(s) | Acceptance Test(s) |
|----------|------------------|----------------------|---------------------|---------------|---------------------|----------------|--------------------|
| UR-1     | SR-1, SR-2       | SS-1                 | MD-1.1, MD-1.2, MD-1.3 | UT-1        | IT-1                | ST-1, ST-2     | AT-1               |
| UR-2     | SR-3, SR-4       | SS-3, SS-4           | MD-2.1–2.3, MD-3.3, MD-3.4 | UT-2, UT-3, UT-4, UT-5 | IT-1, IT-2 | ST-3           | AT-1               |
| UR-3     | SR-5             | SS-4                 | MD-3.5              | UT-6          | IT-2                | ST-4           | AT-1               |
| UR-4     | SR-6             | SS-5                 | MD-4.2              | UT-7          | IT-3                | ST-5           | AT-1               |
| UR-5     | SR-7             | SS-1, SS-3, SS-4     | (all perf-critical) | —             | IT-1, IT-2          | ST-1           | AT-2               |
| UR-6     | SR-8             | SS-3                 | MD-2.1              | —             | IT-1                | ST-6           | AT-3               |
| UR-7     | SR-9             | SS-2, SS-5           | MD-4.1              | —             | IT-4                | ST-7           | AT-4               |

---

## 16. Defect Management Loop

When a test case fails:

1. Log the defect with the failing test ID, actual result, and environment.
2. Trace back up the left arm of the V to locate the root cause (code → module design → subsystem design → requirement).
3. Fix at the lowest appropriate level.
4. Re-run the failing test **and** any upstream tests that exercise the same component (regression).
5. Update this document if the requirement itself was at fault.

---

## 17. Conclusion

This document specifies *Sweet Ninja* as a **fully V-Model–compliant** system:

- Every **user requirement** (left-top) is validated by an **acceptance test** (right-top).
- Every **system requirement** is verified by a **system test**.
- Every **subsystem interface** is verified by an **integration test**.
- Every **module** is verified by a **unit test**.
- Every test case uses **IEEE-style preconditions, inputs, steps, expected results, and pass/fail criteria**.
- The **traceability matrix (§15)** proves bidirectional coverage.

The result is a system design that is testable, traceable, and defensible against any "how do you know it works?" question.

---

## 18. Gameplay Experience & Juice (NEW)

### Visual Effects
- Slice trail follows finger movement
- Particle explosion when objects are hit
- Screen shake when bomb is triggered

### Audio
- Swipe sound ("whoosh")
- Fruit pop ("pop")
- Bomb explosion ("boom")

### Mechanics Enhancements
- Combo multiplier for multiple hits in one swipe
- Increasing difficulty (faster falling objects)
- Special bonus fruit with higher score

---

## 19. Data Model Specification (NEW)

```python
class Finger:
    x: float
    y: float
    timestamp: int

class GameObject:
    type: str  # fruit | candy | bomb
    x: int
    y: int
    radius: int
    velocity: float
    value: int
```

---

## 20. Main Game Loop (Execution Flow) (NEW)

```python
while game_running:
    frame = read_frame()
    frame = apply_fade(frame, 0.5)

    finger = get_finger_position(frame)

    objects = update_physics(objects)
    hits = check_collision(finger, objects)

    score += calculate_score(hits)

    if bomb_hit(hits):
        game_running = False

    frame = draw_objects(frame, objects)
    frame = draw_score(frame, score)

    display(frame)
```

---

## 21. Build & Implementation Roadmap (NEW)

1. Implement camera capture and display
2. Integrate hand tracking (MediaPipe) - **FIXED: Correctly mapping React-Webcam internal video element**
3. Render finger tracking
4. Implement collision detection
5. Add object spawning system
6. Add scoring and UI
7. Add sound and visual effects
8. Optimize performance and latency

---

## 22. Edge Case Handling (NEW)

- No hand detected → continue game loop
- Fast movement → still register collision
- Multiple object overlap → all can be hit
- Temporary camera loss → retry without crash

## 13. System Testing (Updated Additions)

### ST-8 --- Fullscreen Camera Display (SR-10)

**Preconditions:** Application running\
**Inputs:** Launch game in fullscreen mode\
**Steps:** 1. Start the game 2. Observe display boundaries

**Expected Result:** - No window borders visible - Camera feed fills
entire screen - Aspect ratio preserved

**Pass / Fail Criterion:** Pass if all three conditions are met

### ST-9 --- Real-Time Score Update (SR-11)

**Preconditions:** Game running with visible objects\
**Inputs:** User pops objects\
**Steps:** 1. Pop a fruit 2. Observe score update timing

**Expected Result:** Score updates within 1 frame

**Pass / Fail Criterion:** Pass if score updates instantly AND matches
internal value

### ST-10 --- Collision-to-Score Flow (SR-12)

**Preconditions:** Game running with objects\
**Inputs:** Finger collides with object\
**Steps:** 1. Trigger collision 2. Observe sequence

**Expected Result:** 1. Collision detected 2. Object identified 3. Score
updated 4. Object removed 5. UI updated

**Pass / Fail Criterion:** Pass if all steps occur in correct order
within 1 frame

------------------------------------------------------------------------

## 15. Traceability Matrix (Updated Rows)

  ----------------------------------------------------------------------------------------
  User    System    Subsystems   Modules   Unit      Integration   System     Acceptance
  Req     Req                              Tests                   Tests      
  ------- --------- ------------ --------- --------- ------------- ---------- ------------
  UR-4    SR-11     SS-4, SS-5   MD-3.4,   UT-5,     IT-3          ST-9       AT-1
                                 MD-4.2    UT-7                               

  UR-1    SR-10     SS-1, SS-5   MD-1.x,   UT-1,     IT-3          ST-8       AT-1
                                 MD-4.x    UT-7                               

  UR-2    SR-12     SS-3, SS-4   MD-3.3,   UT-3,     IT-2          ST-10      AT-1
                                 MD-3.4    UT-5                               
  ----------------------------------------------------------------------------------------
