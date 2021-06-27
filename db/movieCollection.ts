export const MovieCollection = "movies";

export interface Movie<IDType> {
  _id: IDType;
  title: string;
  year: number;
}
