import { ObjectId } from "mongodb";

export const RankingCollection = "rankings";

export interface Ranking<IDType> {
  _id: IDType;
  userId: ObjectId;
  movieIds: ObjectId[];
}
