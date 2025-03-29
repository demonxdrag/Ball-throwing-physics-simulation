# Ball throwing physics simulator
This is a repo containing 2 simulators, a theoretical one using formulae and an iterative one calculating the derivative of each component given a precision % that is determined by the speed of the simulation.

You can see the full specification for the simulator [here](./README-Asessment.md).

![Simulation Preview](./assets/video.gif)

## Logic
My logic on solving this problems goes as follows:

The first step is to know the properties of the elements in the system, considering the material properties and dimensions I can get the weight of both the ball and the rod by applying the following formula:

```
M(rod) = π * R^2 * L * D
R = Rod Radius
L = Rod Length
D = Rod Density in g/cm^3

M(ball) = ((4 * π * R^3) / 3) * D
R = Ball Radius
D = Ball Density in g/cm^3
```

I made this simpler by implementing a parameter in the code that calculates the weight using the density, this way we can change the materials at any point to achieve different results.

The weight is important in this case to calculate the inertia of each element. I did this by applying the following formula

```
Rod Moment Of Inertia
I(center) = (M * R^2) / 4 + (1 / 12) * M * L^2
I(pivot) = I(center) + M * d^2
M = Rod's Mass
L = Rod's Length
d = Pivot point's distance to the center of mass (L/2)
```

```
Ball Moment Of Inertia
I(center) = (2 / 5) * M * R^2
I(pivot) = I(center) + M * d^2
M = Ball's Mass
R = Ball's Radius
d = Pivot point's distance to the center of mass (L/2) considering the radius of the ball too (d-r)
```

My calculations were based on [this](https://pressbooks.bccampus.ca/douglasphys1107/chapter/9-4-dynamics-of-rotational-motion-rotational-inertia/) article

Other properties such as tensile strenght or elasticity I considered but disregarded for this test, I calculated that at a maximum acceleration the system would suffer ~30 MPa of bending stress hoever the yield of 6061 aluminum is ~275MPa, it is unlikely that it affects the system more than air resistance would

At this point we can separate the system in 2 phases.

### Phase 1

The rod starts at the initial angle and accelerates with a Ttorque until it reaches the release angle.

The phase ends when the rod has reached the release angle.

With the moment of inertia I can calculate the final torque forces of the system (Ttorque) by first calculating the air resistance torque affecting the rotation:

```
Tdrag(ball) = -0.5 * ß(ball) * ∂ * A(ball) * ø(t) ** 2 * dP(ball)
Tdrag(rod) = (-0.5 * ß(rod) * ∂ * A(rod) * ø(t) ** 2 * L(rod)) / 2

ß: Drag coefficient
∂: Air density
A: Cross sectional area
ø(t): Angular speed at t
L: Length
dP: Distance to pivot

T(total) = Tmotor - Tgravity + Tdrag(ball) + Tdrag(rod)
```

The resulting angular acceleration then is determined by:

```
angularAcceleration = Ttotal / Itotal
```

Since the system has a fixed maximum velocity, the simulator chooses the minimum between the rotational speed and the maximum speed in rad/s.

### Phase 2

The ball has been released at the release angle with an angular velocity.

The forces applying now are gravity and air resistance on the ball.

The phase ends when the ball touches the floor

When the ball is released we need to move the mechanics into a projectile in motion since it is now a different problem.
The horizontal position `x` as a function of time uses the following formula:

```

x(t) = v[x] * t

```

and the vertical position `y` as a function of time uses the following formula:

```

y(t) = v[y] _ t - (1/2) _ g^2

```

Where

-   t: time
-   v[x,y]: velocity vector
-   g: gravity

When taking into consideration air drag we need to update our formula to a derivative using `t` thus the system will calculate drag and gravity for every tick of the clock:

```
Fdrag = (0.5 * ß * ∂ * A) / W
ß: Drag coefficient
∂: Air resistance
A: Cross sectional area
W: Weight in kg

```

Gravity is a constant acceleration that only applies on the Y axis, whith this in mind, to calculate the velocity over time `t`, we need to add the previously calculated forces:

```
V(t) = V(t-1) + g(t) + d(t))
```

Now it's just a matter of iterating `t` until the ball has touched the floor. Now, since the clock will introduce a precision concern, when the ball is nearing the floor the system pre-computes the intersection with a higher precision for that instant although it will still not be exact, this will depend on the precision the client is looking for.

### Graph

The Graphical interface is done with React Three Fiber which is a Three.js wrapper that runs on top of WebGL.

The system performs a simulation for every change of the input parameters, showing a path and destination with far more precision than the real-time simulation can show. Both the **result** and the trace **path** are shown using the precise calculations whereas the simulation will most likely miss the target by a small amount, this can be counteracted by playing the simulation at a lower speed such as 10%.

There is also a 2D version showing a graph that does not include derivatives and thus is simpler and faster but less precise. It can be toggled using the **3D** toggle at the top of the controls.

### Conclusions

That's it for the test!
You can play with the parameters on display and should get an immediate result.
Instructions on how to run each program are under each implementation's README.md files

```

```
