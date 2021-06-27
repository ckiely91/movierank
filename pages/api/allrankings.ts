import { NextApiRequest, NextApiResponse } from "next";
import { Movie, MovieCollection } from "../../db/movieCollection";
import { runMongoQuery } from "../../db/db";
import { Db, ObjectID } from "mongodb";
import { Ranking, RankingCollection } from "../../db/rankingCollection";
import { User, UserCollection } from "../../db/userCollection";

interface userRanking {
  userName: string;
  rankPct: number;
  rankNumber: number;
  rankOutOf: number;
}

export interface MovieWithUserRankings extends Movie<string> {
  averageRanking: number;
  userRankings: userRanking[];
}

export interface getAllMoviesWithUserRankingsResp {
  rankedMovies: MovieWithUserRankings[];
  unrankedMovies: MovieWithUserRankings[];
  userIds: string[];
}

export const getAllMoviesWithUserRankings =
  async (): Promise<getAllMoviesWithUserRankingsResp> => {
    return await runMongoQuery(
      async (db: Db): Promise<getAllMoviesWithUserRankingsResp> => {
        // Collect all our data

        const [allMovies, rankings] = await Promise.all([
          db.collection<Movie<ObjectID>>(MovieCollection).find().toArray(),
          db
            .collection<
              {
                user: User<ObjectID>[];
              } & Ranking<ObjectID>
            >(RankingCollection)
            .aggregate([
              {
                $lookup: {
                  from: UserCollection,
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
              },
            ])
            .toArray(),
        ]);

        const movieMap = allMovies.reduce(
          (prev: Record<string, MovieWithUserRankings>, next) => {
            prev[next._id.toString()] = {
              ...next,
              _id: next._id.toString(),
              averageRanking: 0,
              userRankings: [],
            };
            return prev;
          },
          {}
        );

        const userIds: string[] = [];

        // For each user's rankings, go through and update the userRankings on the movies.
        for (let i = 0; i < rankings.length; i++) {
          const {
            user: [user],
            movieIds,
          } = rankings[i];

          userIds.push(user._id.toString());

          for (let j = 0; j < movieIds.length; j++) {
            if (movieMap[movieIds[j].toString()]) {
              movieMap[movieIds[j].toString()].userRankings.push({
                userName: user.name,
                rankPct: movieIds.length > 1 ? j / (movieIds.length - 1) : 0,
                rankNumber: j + 1,
                rankOutOf: movieIds.length,
              });
            }
          }
        }

        const rankedMovies: MovieWithUserRankings[] = [];
        const unrankedMovies: MovieWithUserRankings[] = [];

        for (const movie of Object.values(movieMap)) {
          if (movie.userRankings.length === 0) {
            unrankedMovies.push(movie);
            continue;
          }

          const totalRank = movie.userRankings.reduce(
            (prev, next) => prev + next.rankPct,
            0
          );
          movie.averageRanking = totalRank / movie.userRankings.length;
          rankedMovies.push(movie);
        }

        rankedMovies.sort((a, b) => a.averageRanking - b.averageRanking);
        unrankedMovies.sort((a, b) => a.title.localeCompare(b.title));

        return {
          userIds,
          rankedMovies,
          unrankedMovies,
        };
      }
    );
  };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const resp = await getAllMoviesWithUserRankings();
  res.status(200).json(resp);
}
