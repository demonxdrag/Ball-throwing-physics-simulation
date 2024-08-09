My logic on solving this problems goes as follows:

The first step is to know the properties of the elements in the system, considering the material properties and dimensions I can get the weight of both the ball and the rod by applying the following formula:

```

```

I made this simpler by implementing a parameter in the code that calculates the weight using the density, this way we can change the materials at any point to achieve different results.

The weight is important in this case to calculate the inertia of each element. I did this by applying the following formula

```

```

Note that since the rod's point of rotation is not in an extreme there are forces cancelling each other with regards to gravity. This explains why I'm using a ratio instead of the full length.

Other properties such as tensile strenght or elasticity I considered to be negligible in this case due to the imbalanced nature of the system and the flex [TODOTODOTODO]

Once I have the moment of innertia of the system I can calculate the rotational velocity of the system and extrapolate the velocity at the ball's position at the release moment.

```

```

After this the forces affecting the system would be gravity and air resistance (assuming non-moving air).

We can apply this forces using these set of formulas
```

```

Finally the system needs to stop whenever it reaches either a "floor" or a "wall". Since it was not specified in the requirements document, these are a parameter for the user to control when using the system.
The final distance calculation would be whichever surface it hits first.

Now for the fun part

As you can see in the `src` folder there are two implementations, that is because I tried first to create a CLI with Python and using a game engine to represent the UI but it was not the right approach, it is fun to play and actually release the ball but I realised I need a graph for this and Python UI was just not going to work for the interactivity that I needed.
The second iteration uses Javascript + React (for the inputs) and it represents the equations in a mathematical graph, that way a user can see the distance traveled at any point of the trajectory and it is easier to play with the parameters.

The first Python model used a loop to run every `t` and draw the points in the screen which is not particularly efficient or precise.

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