---
layout: post
title: Solving Project Euler’s “Su Doku” with constraint propagation
tags: [functional, haskell, sudoku, project euler]
usemathjax: true
---

(Spoiler alert: In this post I discuss a solution to a Project Euler problem.
Since it is within the first 100 problems, sharing my solution publicly on this
blog is explicitly [allowed](https://projecteuler.net/#publish){:target="_blank"} by the Project
Euler FAQ. But if you want to solve it on your own, go try it now and don't read
any further!)

## Introduction to the problem

Here's a brief overview of Project Euler's [Problem
96](https://projecteuler.net/problem=96){:target="_blank"}:
- We are given a text file, named `p096_sudoku.txt`, containing 50 9x9 sudoku
	puzzles	listed one after the other, formatted as such:
	```
	Grid 01
	003020600
	900305001
	001806400
	008102900
	700000008
	006708200
	002609500
	800203009
	005010300
	Grid 02
	200080300
	060070084
	030500209
	000105408
	000000000
	402706000
	301007040
	720040060
	004010003
	Grid 03
	000000907
	// etc...
	```
	where `0`s represent blanks.
- Puzzles vary in difficulty, but all are guaranteed to have one unique
  solution.
- After solving a sudoku puzzle, we can then extract the three-digit number
	that is spelled out in the top-left corner of the solved board. For example,
	the solution to `Grid 01` is
	```
	483921657
	967345821
	251876493
	548132976
	729564138
	136798245
	372689514
	814253769
	695417382
	```
	...so the three-digit number from this board is $$483$$.
- We wish to find the sum of all the three-digit numbers we obtain from solving
	all 50 of the provided sudoku boards.

Parsing the boards from the text file in the beginning and taking the sum at
the end are pretty trivial tasks, so I'll mainly focus on the problem of
interest, namely solving the sudoku board.

Each blank in a sudoku board can take on a value between 1-9. Thus, if we try
the dumbest approach and just try out every possible choice to see if it is a
valid solution, we'll have to try, in the worst case, $$9^n$$ times, where $$n$$
is the number of blank squares in the sudoku puzzle.

To give you a vague idea of how quickly this blows up, suppose we have a board
with 25 known numbers, 56 blank spots (very reasonable for a sudoku puzzle).
Then, even if the whole process of filling in the board and checking if it's a
valid solution takes just one nanosecond, we'll be searching for a solution for
up to $$8.68 * 10^{36}$$ _years_. (The universe is around $$1.38 * 10^{10}$$
years old.)

That's a little slow for my preferences, but of course there are ways to
drastically prune the search space as we go.

## The algorithm
Once we know a square to be a certain value, we can definitively eliminate that
value from all other squares in the same box, row, and column as that square.
Each time we remove a possibility from a square, we reduce the size of the
search space dramatically. So, roughly, the procedure is as follows:
- While there are still blanks left in the puzzle:
	- Find the blank that has the fewest possibilities remaining.
	- Make a guess out of its remaining possibilities.
		- Try to solve this puzzle after the guess has been filled in, using the
			same procedure (i.e. find the next square that has the fewest
			possibilities, fill it in with a guess, try solving).
			- If it's solved, we're done!
			- If not, make a different guess, and try solving again.

In this way, every guess introduces new constraints on other squares, and these
_constraints_ get _propagated_ down along the search tree – hence the name.

## Writing the code
The first order of business is deciding how we're going to represent the sudoku
board within memory.

As always, its a good idea to break a more sophisticated and daunting problem
down into smaller parts, so let's focus on how to represent a single square of
the board first.

For any square in a sudoku puzzle, we either know it to
- _definitely_ be a certain value between 1-9 (either because it was given in
	the original puzzle, or because we reasoned out that it must be the case),
- or we might have a set of values which it might _possibly_ be (i.e. we aren't
	too sure yet, but maybe when we solve some other part of the board we can come
	back and figure it out for sure).

We can store all of that information in a simple algebraic data type:
```haskell
data Square = Definitely Int | Possibly (Set Int)
```

And, since we'll need it later, we'll just define a very simple predicate to
check if a square's value is definitively known, or still uncertain:

```haskell
is_possibly (Possibly _) = True
is_possibly _ = False
```

(I'm using a `Set` here in the `Possibly` case to store the different
possible values for the square, but you could easily use something like an
integer list or bitset as well.)

A board is made up of 81 squares. I decided to just define a board to be an
`Array` of `Square`s of size 81, where the squares are numbered as such:
```
0  1  2  | 3  4  5  | 6  7  8
9  10 11 | 12 13 14 | 15 16 17
18 19 20 | 21 22 23 | 24 25 26
---------+----------+---------
27 28 29 | 30 31 32 | 33 34 35
36 37 38 | 39 40 41 | 42 43 44
45 46 47 | 48 49 50 | 51 52 53
---------+----------+---------
54 55 56 | 57 58 59 | 60 61 62
63 64 65 | 66 67 68 | 69 70 71
72 73 74 | 75 76 77 | 78 79 80
```
This allows for fairly easy accessing and updating. For example, if we want to
access the `Square` in the board that is the 3rd square from the left, 2nd from
top (i.e. square 11), all we have to do is take its x-coordinate and add it to
nine times its y-coordinate, i.e. $$2 + 9 * 1 = 11$$ (note that coordinates are
zero-indexed for this to work, so that's why they are one less than what you
think they would be).

Okay, so we established that a `Board` is really just an array of `Square`s...
```haskell
type Board = Array Int Square
```
And while we're at it, we might as well define a "blank board" that we'll be
using later, which is just an empty board in which no `Square` is `Definitely`
a particular value, and every square can `Possibly` be any value between 1-9.
```haskell
blank_board = listArray (0, 80) (repeat blank & take 81)
  where blank = Possibly (fromList [1..9])
```

Many of these squares are related to each other in a particular way; for
example, if we were to fill in the value of some square, we should update all
other squares along the same row, column, or box to no longer possibly be that
value.

It would be a good idea to build a "lookup table" of sorts so its easy to do
this updating later on. In this table, I want to be able to look up the index of
the square I'm updating – say I'm updating square 40, right in the middle of the
board – and get back a list of the indices of its peers, or the squares that
need to have their constraints updated – in this example, that would be squares
4, 13, 22, 30, 31, 32, 36, 37, 38, 39, 41, 42, 43, 44, 48, 49, 50, 58, 67, and
76.

Let's first build up all of the different
[houses](http://sudopedia.enjoysudoku.com/House.html){:target="_blank"} in a sudoku board – all
the rows, columns, and boxes.
```haskell
x = [0..8]
y = [0..8]
-- hey, that's the formula I mentioned earlier!
rows = [fromList [a + 9 * b | a <- x] | b <- y]
cols = [fromList [a + 9 * b | b <- y] | a <- x]
-- Fairly nasty list comprehension for boxes, could probably be cleaner
boxes = [fromList [a + 9 * b + (c * 3) + (d * 27) | a <- [0..2], b <- [0..2]] | c <- [0..2], d <- [0..2]]
houses = rows ++ cols ++ boxes
```
So now `rows` is a list of sets of indices; each set has the indices of all
the squares that are in the same row. Similar goes for `cols` and `boxes`.
`houses` is just all three of those lists combined together.

All the peers of a certain square are all the squares in the same row, column,
or box; thus to get all the peers of a certain index, we just need to get all
of the sets in `houses` that contain our desired index, and `union` them all
together.
```haskell
peers = listArray (0, 80) [combined $ houses_containing i | i <- [0..80]]
  where houses_containing i = filter (member i) houses
        combined setlst = foldl union empty setlst
```

With the lookup table of peers in hand, we can write our first serious function
to add a guess to a `Square` in the `Board` and update the constraints of all of
its corresponding peers.

What's the type signature of this function going to look like? Well, it'll take
a `Board` of course, the index of the square that we're making a guess for (an
integer), and finally the guess itself (also an integer). And it'll return the
`Board` after we've made the desired updates.

```haskell
make_guess :: Board -> Int -> Int -> Board
```

The process is simple: first we'll change the square we have a guess for to be
`Definitely val`, where `val` is our guess, and then we'll remove that
possibility from all its peers. We define `update_square` and
`remove_possiblity` to help with doing that, and fold over all peers to get the
final board with all the changes.

```haskell
make_guess board idx num = remove_all $ peers ! idx
  where board_with_guess = board // [(idx, Definitely num)]
        update_square (Definitely val) = Definitely val
        update_square (Possibly vals) = Possibly (delete num vals)
        remove_possibility b i = b // [(i, update_square $ b ! i)]
        remove_all = foldl remove_possibility board_with_guess
```

This is all we need to write our `solve` function! `solve` will recursively
find the `Square` (for which we don't `Definitely` know a value for) with the
least number of possibilities, make a guess in that square using `make_guess`,
and then try solving the board in that new state.

Obviously not all boards are solvable (not all of our guesses will work!) so
`solve` won't necessarily return a solved `Board`; instead, we'll have it take
the unsolved board, and return a `Maybe Board`, where the return value is
`Nothing` if the board is unsolvable:

```haskell
solve :: Board -> Maybe Board
```

The code is not too complicated: we use `assocs board` to get a list of
`(index, Square)` pairs, from which we filter out the squares whose values
are known, and sort the remaining elements by the size of their `Possibly` set.

If there is an element that has no possible values remaining (i.e. the size
of it's `Possibly` set is 0), then the board is unsolvable; we've reached a
contradiction, since every square in a solved sudoku board should be a concrete
value between 1 and 9.

One perhaps hidden optimization is that the function stops searching after the
first solution (known to be the only one, in our case); this is achieved through
the use of `msum` (monad sum) and `map`. Since `map` is lazily evaluated, we
won't be searching for solutions on every possible guess; we can stop after the
first solution is found and just return it.

```haskell
solve board = case unsolved of
  [] -> Just board
  ((i, Possibly x):xs) ->
    if (size x) == 0 then
      Nothing
    else
      msum $ map (solve . make_guess board i) $ toList x
  where unsolved = assocs board
          & filter (is_possibly . snd)
          & sortBy (\(_, Possibly a) (_, Possibly b) -> compare (size a) (size b))
```

And that's all. We've written a sudoku solver.

---

To help us check everything is working properly, and since we'll need to be able
to parse boards later from the text file, here's two more functions
`parse_board` and `show_board`, which convert from and to a string
representation of the board respectively. (Slight implementation quirk:
`parse_board` expects strings without newlines, i.e. all the numbers in one long
81-character string, while `show_board` returns the string with pretty-printed
newlines, so the two functions aren't precise inverses of each other.)

```haskell
-- small helper function to break list into chunks that we'll need now and
-- later. i.e. list_chunks 2 [1,2,3,4,5,6] = [[1,2],[3,4],[5,6]]
list_chunks :: Int -> [a] -> [[a]]
list_chunks n [] = []
list_chunks n lst = (take n lst) : (list_chunks n $ drop n lst)

parse_board :: String -> Board
parse_board str = zip str [0..]
  & filter (\(c,_) -> c /= '0')
  & foldl (\b (c,i) -> make_guess b i (digitToInt c)) blank_board

show_board :: Board -> String
show_board board = elems board
  & map (\e -> case e of
      Definitely val -> intToDigit val
      Possibly _ -> '0')
  & list_chunks 9
  & intercalate "\n"
```

Let's just check everything is working properly with a simple main function,
solving the first board in `p096_sudoku.txt`.

```haskell
main :: IO ()
main = case (parse_board "003020600900305001001806400008102900700000008006708200002609500800203009005010300" & solve) of
  Just x -> putStrLn $ show_board x
  Nothing -> putStrLn "Couldn't solve"
```

And the output from running:
```
483921657
967345821
251876493
548132976
729564138
136798245
372689514
814253769
695417382
```

Which is the solved board, as desired.

Everything is working now, the last step is to solve all the boards in the file,
grab out the top 3 numbers from all boards, and return the sum. We'll write a
separate function for getting the top three values, and update our `main`
function for the rest.

Here's `get_top_three`:

```haskell
get_top_three :: Board -> Maybe Int
get_top_three board = case take 3 $ elems board of
  [Definitely x, Definitely y, Definitely z] -> Just (100 * x + 10 * y + z)
  _ -> Nothing
```

and here's the new `main`:

```haskell
main :: IO ()
main = do
  content <- readFile "p096_sudoku.txt"
  print $ solve_and_total $ get_puzzles content
  where get_puzzles content = lines content
          & filter (not . isPrefixOf "Grid")
          & list_chunks 9
          & map (intercalate "")
          & map parse_board
        puzzle_to_num puzzle = case solve puzzle >>= get_top_three of
          Nothing -> 0
          Just x -> x
        solve_and_total = foldl (\acc puzzle -> acc + puzzle_to_num puzzle) 0
```

All we do is remove all the "Grid XX" lines from the text file, split it into
chunks of 9 lines each, join each chunk into a whole string, and parse it into
a board. Then we solve it, grab the number out, and take the total!

That wraps up the code, and the problem as a whole. Our program spits out the
correct number from the computation, which I won't list here for sake of not
giving away Project Euler answers for absolutely zero effort, but if you've
followed along so far it should be easy for you to get the answer!

That's all.

## Full code listing
`sudoku.hs`
```haskell
{-
 Imports from standard library. Useful functions we'll use in our code.
-}

import Data.Set (Set, fromList, empty, union, member, size, delete, toList)
import Data.List (sortBy, isPrefixOf, intercalate)
import Data.Array (Array, assocs, elems, (!), (//), listArray)
import Data.Function ( (&) )
import Data.Char (digitToInt, intToDigit)
import Control.Monad (msum)
import Data.Maybe (Maybe)


{-
  Defining how to represent the sudoku board using data structures.
-}

data Square = Definitely Int | Possibly (Set Int)
is_possibly (Possibly _) = True
is_possibly _ = False

type Board = Array Int Square

-- useful constant to have: all boards start from blank and get
-- filled in
blank_board = listArray (0, 80) (repeat all_possible & take 81)
  where all_possible = Possibly (fromList [1..9])


{-
  Building our peers lookup table that we'll reference when making
  guesses on the board.
-}

x = [0..8]
y = [0..8]
rows = [fromList [a + 9 * b | a <- x] | b <- y]
cols = [fromList [a + 9 * b | b <- y] | a <- x]
boxes = [fromList [a + 9 * b + (c * 3) + (d * 27) | a <- [0..2], b <- [0..2]] | c <- [0..2], d <- [0..2]]
houses = rows ++ cols ++ boxes

peers = listArray (0, 80) [combined $ houses_containing i | i <- [0..80]]
  where houses_containing i = filter (member i) houses
        combined setlst = foldl union empty setlst


{-
  The two major functions that do the majority of the work: make_guess
  and solve. solve uses make_guess to recursively explore a tree of
  guesses, stopping when it finds a full solution.
-}

make_guess :: Board -> Int -> Int -> Board
make_guess board idx num = remove_all $ peers ! idx
  where board_with_guess = board // [(idx, Definitely num)]
        update_square (Definitely val) = Definitely val
        update_square (Possibly vals) = Possibly (delete num vals)
        remove_possibility b i = b // [(i, update_square $ b ! i)]
        remove_all = foldl remove_possibility board_with_guess

solve :: Board -> Maybe Board
solve board = case unsolved of
  [] -> Just board
  ((i, Possibly x):xs) ->
    if (size x) == 0 then
      Nothing
    else
      msum $ map (solve . make_guess board i) $ toList x
  where unsolved = assocs board
          & filter (is_possibly . snd)
          & sortBy (\(_, Possibly a) (_, Possibly b) -> compare (size a) (size b))


{-
  Handling IO and Project Euler-specific stuff: parsing and showing
  the board as a string, getting the 3 digit number from a solved
  board, etc.
-}

list_chunks :: Int -> [a] -> [[a]]
list_chunks n [] = []
list_chunks n lst = (take n lst) : (list_chunks n $ drop n lst)

parse_board :: String -> Board
parse_board str = zip str [0..]
  & filter (\(c,_) -> c /= '0')
  & foldl (\b (c,i) -> make_guess b i (digitToInt c)) blank_board

show_board :: Board -> String
show_board board = elems board
  & map (\e -> case e of
      Definitely val -> intToDigit val
      Possibly _ -> '0')
  & list_chunks 9
  & intercalate "\n"

get_top_three :: Board -> Maybe Int
get_top_three board = case take 3 $ elems board of
  [Definitely x, Definitely y, Definitely z] -> Just (100 * x + 10 * y + z)
  _ -> Nothing


{-
  The main function, which is the entry point of the program and handles
  reading the file and calling the rest of the functions to obtain the
  final answer.
-}

main :: IO ()
main = do
  content <- readFile "p096_sudoku.txt"
  print $ solve_and_total $ get_puzzles content
  where get_puzzles content = lines content
          & filter (not . isPrefixOf "Grid")
          & list_chunks 9
          & map (intercalate "")
          & map parse_board
        puzzle_to_num puzzle = case solve puzzle >>= get_top_three of
          Nothing -> 0
          Just x -> x
        solve_and_total = foldl (\acc puzzle -> acc + puzzle_to_num puzzle) 0
```
