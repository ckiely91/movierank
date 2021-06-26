import { ObjectID } from "mongodb";

export const UserCollection = "users";

export interface User<IDType> {
  _id: IDType;
  accessToken: string;
  name: string;
}
