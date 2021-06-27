import { NextApiRequest, NextApiResponse } from "next";
import { runMongoQuery } from "../../db/db";
import { User, UserCollection } from "../../db/userCollection";
import { Movie, MovieCollection } from "../../db/movieCollection";
import { Ranking, RankingCollection } from "../../db/rankingCollection";
import { Db, ObjectID } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    await handleGet(req, res);
  } else if (req.method === "POST") {
    await handlePost(req, res);
  } else {
    res.status(404).send(null);
  }
}

export interface RankingGetResp {
  rankedMovies: Movie<string>[];
  unrankedMovies: Movie<string>[];
}

export const getMovieRankingsForAccessToken = async (
  accessToken: string
): Promise<RankingGetResp> => {
  return runMongoQuery(async (db): Promise<RankingGetResp> => {
    const user = await db.collection<User<ObjectID>>(UserCollection).findOne({
      accessToken: accessToken,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get the full list of movies, and also the rankings for this user
    const [allMovies, ranking] = await Promise.all([
      await db
        .collection<Movie<ObjectID>>(MovieCollection)
        .find(
          {},
          {
            sort: {
              title: 1,
            },
          }
        )
        .toArray(),
      await db.collection<Ranking<ObjectID>>(RankingCollection).findOne({
        userId: user._id,
      }),
    ]);

    if (!ranking) {
      // No ranking exists yet, we can simply just return all movies as unsorted
      return {
        rankedMovies: [],
        unrankedMovies: allMovies.map((m) => ({ ...m, _id: m._id.toString() })),
      };
    }

    const rankedMovies: Movie<string>[] = [];
    const unrankedMovies: Movie<string>[] = [];

    const movieMap = allMovies.reduce(
      (prev: Record<string, Movie<ObjectID>>, next) => {
        prev[next._id.toString()] = next;
        return prev;
      },
      {}
    );

    const rankedMovieIds: Record<string, true> = {};

    for (let i = 0; i < ranking.movieIds.length; i++) {
      const movie = movieMap[ranking.movieIds[i].toString()];
      if (!movie) {
        continue;
      }

      rankedMovieIds[movie._id.toString()] = true;

      rankedMovies.push({
        ...movie,
        _id: movie._id.toString(),
      });
    }

    for (let i = 0; i < allMovies.length; i++) {
      if (rankedMovieIds[allMovies[i]._id.toString()]) {
        continue;
      }

      unrankedMovies.push({
        ...allMovies[i],
        _id: allMovies[i]._id.toString(),
      });
    }

    return {
      rankedMovies,
      unrankedMovies,
    };
  });
};

const handleGet = async (
  req: NextApiRequest,
  res: NextApiResponse<RankingGetResp | string>
) => {
  // First get the user by their access token
  const { accessToken } = req.query;
  if (!accessToken || Array.isArray(accessToken)) {
    res.status(422).send("Access token required");
    return;
  }

  const resp = await getMovieRankingsForAccessToken(accessToken);
  res.status(200).json(resp);
};

// POST request - the user wants to update their rankings. This endpoint simply takes
// an array of movie IDs
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  // First get the user by their access token
  const { accessToken } = req.query;
  if (!accessToken || Array.isArray(accessToken)) {
    res.status(422).send("Access token required");
    return;
  }

  // The body of the request should be a JSON formatted array of movie IDs.
  const movieIds: string[] = req.body;
  if (movieIds.some((m) => typeof m !== "string")) {
    res.status(422).send(null);
    return;
  }

  await runMongoQuery(async (db: Db): Promise<void> => {
    const user = await db.collection<User<ObjectID>>(UserCollection).findOne({
      accessToken: accessToken,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const movieIdsAsObjectIds = movieIds.map(
      (movieId) => new ObjectID(movieId)
    );

    // Upsert the user's rankings
    await db.collection<Ranking<ObjectID>>(RankingCollection).updateOne(
      {
        userId: user._id,
      },
      {
        $set: {
          userId: user._id,
          movieIds: movieIdsAsObjectIds,
        },
      },
      {
        upsert: true,
      }
    );
  });

  res.status(204).send(null);
};
