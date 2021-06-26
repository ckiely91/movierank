export const MovieCollection = "movies";

export interface Movie<IDType> {
  _id: IDType;
  name: string;
  year: number;
}
