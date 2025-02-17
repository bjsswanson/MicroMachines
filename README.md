# MicroMachines


ThreeJS implementation of MicroMachines style game.

Current game objects include:

| Game Objects | Description |
| ------------ | ----------- |
| Car | Self explanatory, contains current state of a car (can be multiple) |
| Obstacle | An obstacle is an object which can collide with the front of the car, currently bouncing back on collision |
| Surface | An obstacle a car can drive across (e.g. the ground or a table) |
| Ramp | An object that sets the cars velocity to a predefined value (Jumps). |
| Waypoint | An object that contains information about the cars' progress. It has a plane which must be intersected to activate. A waypoint can reset the cars to a defined postion.

Each Game Object has an update method to be run in the animation cycle on each frame.

## Tasks


### Required Tasks

| Task | Description | Person | Complete? |
| ---- | ----------- | ------ | --------- |
| Team Name | What's a team without a good name. (Personally I like "MegaMachines!") | All | N |
| ThreeJS Tutorials | Everyone should familiarise themselves with ThreeJS as much as possible during the hack | All | N |
| Core Library | Includes Car, Ground, Gravity, Collisions (Ground and Obstacles). I have started work refining the demo into a usable library. | Ben | Y |
| 3D Models | Create or Download | Ben/Chloe | Y |
| Control | Mobile Websockets, Tap or Accelerometer | Pak | Y |
| Gameplay | Who's winning, are cars off screen? | Ben | Y |
| Waypoints | If Cars go off screen, we need to be able to tell where to reset them | Ben | Y |
| Camera | Where does the camera look (Lead Car? Average Position of all cars? | Ben | Y |
| Website Interface | | | N |
| Logins | Player names | | N | 

### Additional Tasks

| Task | Description | Person | Complete? |
| ---- | ----------- | ------ | --------- |
| Level descriptor files | Postions of objects, etc, See ObjExporter.js in ThreeJS (could be adapted/used), Make sure to cache meshes for resuse | Ben | Y |
| Jumps | Ramps/Gravity/Physics | Ben | Y |
| Physics | Knocking over stuff (PhysiJS) | | N |
| Sound | SoundJS | | N  | 
| Loading/Preloading | 3D models and images | Ben | Y |
| 1,2,3,Go | Prevent race start until all ready | Ben | Partial |
| Obstacle movement | (TweenJS) e.g. Pool table where balls move | | N |
| High Scores | Leaderboards | | N |

## Notes / Useful Info

### Animation Cycle

The main game is setup and controlled from MicroGame.js

Commonly in games and animation libraries there are two main methods, Setup() and Update()

Setup() creates the initial state of the game
Update() loops continuously updating the state of the game and rendering each frame.
 
In the case of this game the setup is handled as separate functions in the top of the MicroGame.js file.
Once setup is complete the **animate();** method is run in a loop (using the browser's requestAnimationFrame(); method), 
which has advantages such as pausing while the user is on a different tab.

### Car Physics

Currently, every frame two sets of forces apply on each car (although they are combined before moving the position of the car).

| Force Type | Description |
| ----- | ----------- |
| updateVelocity | These are forces that are consistent on each frame. e.g. Gravity applies the same force each frame |
| car.velocity | These are forces that apply between frames, e.g. If you let go of the forward key the car should continue to move forward (until drag stops the car) |

In the table below I will try to describe each force that applies to the car on each frame

| Force | Force Type | Description |
| ----- | ---------- | ----------- |
| Gravity | updateVelocity | Only applied if the car is not in contact (less than 0.3 units) away from a surface, applied to updateVelocity instead of car.velocity so that gravity does not accumulate while in the air |
| Input Force | car.velocity | On each frame, if the input button is held down and the car is on a surface then a directional force is applied. This force can accumulate over multiple updates until it hits the limit and is clamped. |
| Drag | car.velocity | Drag is a fraction of car.velocity that is removed every update. This ensures that the car comes to a halt one the input keys are released. |
| Collision | car.velocity | Explained in further detail below. Force is applied when colliding with an obstacle. Car velocity out of the collision is calculated and the current car.velocity is set to this value (rather than adding) |
| Ramp.boost | car.velocity | When the car's down ray-caster touches the ramp, car.velocity is set to a predefined ramp velocity. This guarantees cars hitting the ramp will end up at the correct destination. Otherwise ramps become difficult to use and could be game breaking. | 

### Surfaces

Surfaces are meshes that the car's sit on top of. Each car detects collision with a surface using a down facing raycaster - Vector3(0, -1, 0).
An object can be both a Surface and an Obstacle.

### Obstacles

Obstacles are objects that a car can collide with. Each car has 4 raycasters that check for collisions:
- forward ( ↑ ) 0 degrees
- forward left ( ↖ ) -45 degrees
- forward right ( ↗ ) 45 degrees
- backwards ( ↓ ) 180 degrees

These give the best coverage for a mainly forward moving vehicle without impacting performance (8 ray-casters untested).

If any of these ray-casters intersects less than a certain distance (per ray-caster) then a resultant vector is calculated and is set as the car's
current velocity.

#### Resultant Car Velocity

Once a collision is detected, the [normal vector](http://en.wikipedia.org/wiki/Normal_\(geometry\)) of the colliding face is
given the same length as the current car velocity and then added to the current car velocity. This gives a psuedo realistic 
resulting vector from the collision. This vector is then halved in order to dampen the result (slow the car) and a small
vector in the direction of the collision normal (1/10) is added to add a little bounce.

TODO: Add Diagram

### Ramps

Ramps are objects that set a car's velocity to a predefined direction and speed. A ramp is detected using each car's down ray-caster.
Having the car's velocity set to a defined vector is useful as it means that no matter what speed or direction the car hits the ramp,
the car will end up in the intended location (i.e. on a table), preventing difficult sections of track.

### Level loading

Level loading is controlled by MicroLoader.js

Levels are defined in JSON files. (See /levels/test.json for an example). The JSON file contains the positions of all the necessary game objects needed to load the game.
The loader first loops through the cars and objects and places each path to a 3D model in a map (with multiples of the same model overriding each other).
This leaves us a map with all of the 3D models required for that level.

Then the models are loaded asynchronously using THREE.js JSONLoader class.
Once all the models are loaded, the cars, obstacles, surfaces and ramps are initialised using the meshes of the 3D models and a callback is function is run.

### Waypoints

Waypoints track the progress of the cars through the level. Each level descriptor file will contain a set of waypoints.

Each waypoint has a plane that must be passed through by any car in order to activate it. (The plane will turn from red to green)
If one of the cars falls off or falls too far behind then all the cars are reset to the current waypoint using a specified position for each car.

```javascript
{
	"trigger": { 
		"position": [5, 14, 0], //Position of the plane
		"width": 10, //Width of the plane
		"height": 5, //Height of the plane
		"rotation": 90 //Rotation of trigger plane
	},
	"positions": [ //Positions for resetting the cars
		[5, 20, -1], 
		[5, 20, 1]
	],
	"rotation": 90 //Rotation to reset the cars to
}
```

As each waypoint is passed through the next waypoint in the array is set in the **nextWaypoint** variable. 
The car closest to the next waypoint is then determined to be in the lead. 