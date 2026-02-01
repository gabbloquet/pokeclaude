export interface MapData {
  width: number;
  height: number;
  tiles: number[];
  playerStart: { col: number; row: number };
}

// Tile types:
// 0 = grass (walkable)
// 1 = wall (collision)
// 2 = path (walkable)
// 3 = tall grass (walkable, encounter zone)
// 4 = water (collision)

export const testMap: MapData = {
  width: 20,
  height: 15,
  playerStart: { col: 10, row: 7 },
  tiles: [
    // Row 0 - Top wall
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    // Row 1
    1, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 1,
    // Row 2
    1, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 1,
    // Row 3
    1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 1, 0, 1,
    // Row 4
    1, 0, 0, 1, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1, 1, 0, 1,
    // Row 5
    1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1,
    // Row 6
    1, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 3, 3, 1,
    // Row 7 - Center row (player start)
    1, 3, 3, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 3, 3, 1,
    // Row 8
    1, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 3, 3, 1,
    // Row 9
    1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1,
    // Row 10
    1, 0, 0, 4, 4, 4, 0, 0, 0, 2, 2, 2, 0, 0, 0, 4, 4, 4, 0, 1,
    // Row 11
    1, 0, 0, 4, 4, 4, 0, 0, 0, 0, 2, 0, 0, 0, 0, 4, 4, 4, 0, 1,
    // Row 12
    1, 0, 0, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 1,
    // Row 13
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    // Row 14 - Bottom wall
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
};
