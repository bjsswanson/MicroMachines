# MicroMachines


ThreeJS implementation of MicroMachines style game.

Current game objects include:

| Game Objects | Description |
| ------------ | ----------- |
| Car | Self explainatory, contains current state of a car (can be multiple) |
| Obstacle | An obstacle is an object which can collide with the front of the car, currently bouncing back on collision |
| Surface | An obstacle a car can drive across (e.g. the ground or a table) |

Each Game Object has an update method to be run in the animation cycle on each frame.

## Tasks


### Required Tasks

| Task | Description | Complete? |
| ---- | ----------- | --------- |
| Team Name | What's a team without a good name. (Personally I like "MegaMachines!") | N |
| ThreeJS Tutorials | Everyone should familiarise themselves with ThreeJS as much as possible during the hack | N |
| Core Library | Includes Car, Ground, Gravity, Collisions (Ground and Obstacles). I have started work refining the demo into a usable library. | Partial |
| 3D Models | Create or Download | Partial |
| Control | Mobile Websockets, Tap or Accelerometer | N |
| Gameplay | Who's winning, are cars off screen? | N |
| Waypoints | If Cars go off screen, we need to be able to tell where to reset them | N |
| Camera | Where does the camera look (Lead Car? Average Position of all cars? | N |
| Website Interface, Logins | | N |

### Additional Tasks

| Task | Description | Complete? |
| ---- | ----------- | --------- |
| Level descriptor files | Postions of objects, etc | N |
| Jumps | Ramps/Gravity/Physics | N |
| Physics | Knocking over stuff (PhysiJS) | N |
| Sound | SoundJS | N | 
| Loading/Preloading | 3D models and images | N |
| 1,2,3,Go | Prevent race start until all ready | N |
| Obstacle movement | (TweenJS) e.g. Pool table where balls move | N |
