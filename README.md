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

Once I have the moment of innertia of the system I can calculate the rotational velocity of the system and extrapolate the velocity at the ball's position at the release moment.

```
sqrt((2 * T * D0) / I(total))
T = Motor Torque in NM
D0 = Delta between the initial and release angle
```

Since the system has a fixed maximum velocity, the simulator chooses the minimum between the rotational speed and the maximum speed in rad/s.

Finally the system needs to stop whenever it reaches either a "floor" or a "wall". Since it was not specified in the requirements document, these are a parameter for the user to control when using the system.
The final distance calculation would be whichever surface it hits first.

Now for the fun part

As you can see in the `src` folder there are two implementations, that is because I tried first to create a CLI with Python and using a game engine to represent the UI but it was not the right approach, it is fun to play and actually release the ball but I realised I need a graph for this and Python UI was just not going to work for the interactivity that I needed.
The second iteration uses Javascript + React (for the inputs) and it represents the equations in a mathematical graph, that way a user can see the distance traveled at any point of the trajectory and it is easier to play with the parameters.

The first Python model used a loop to run every `t` and draw the points in the screen which is not particularly efficient or precise. _This has an older implementation missing many of the conditions_

The second Javascript model uses an equation that represents `t` as a pixel in the graph and draws a pixel perfect path.

To elaborate more on these equations, when the ball is released we need to move the mechanics into a projectile in motion since it is now a different problem.
The horizontal position `x` as a function of time uses the following formula:
```
x(t) = v[x] * t
```
and the vertical position `y` as a function of time uses the following formula:
```
y(t) = v[y] * t - (1/2) * g^2
```
Where
- t: time
- v[x,y]: velocity vector
- g: gravity

When taking into consideration air drag we need to update our formula to:
```
x(t) = (v[x] / ß) * (1 - e^(-ß * t))
y(t) = (v[y] + g / ß / ß) * ((1 - e^(-ß * t)) - (g * t) / ß)
```
Where `ß` is the drag of the ball and it's calculated by:
```
(1/2 * dragCoefficient * airDensity * ballArea) / ballWeight
```

With this formula I can plot the graph however I still need to find an intersection point between the ball's path and the floor, for that I can use `y=floor` and extract `t` from our `y(t)` formula:
```
(v[y] + sqrt(v[y]^2 + 2 * g * d)) / g
```
Where
- v: velocity vector
- g: gravity
- d: distance between the release point and the floor

Once I have this value I can easily integrate it in the `x(t)` formula to get the `x` distance when the ball touches the ground.

That's it for the test!
You can play with the parameters on display and should get an immediate result.
Instructions on how to run each program are under each implementation's README.md files