import { Movie } from "../../db/movieCollection";
import { FC } from "react";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getMovieRankingsForAccessToken } from "../api/ranking";

interface IEditRankingProps {
  rankedMovies: Movie<string>[];
  unrankedMovies: Movie<string>[];
}

const EditRanking: FC<IEditRankingProps> = ({
  rankedMovies,
  unrankedMovies,
}) => {
  console.log("rankedMovies", rankedMovies, "unrankedMovies", unrankedMovies);
  return <div>Hello!</div>;
};

export default EditRanking;

export const getServerSideProps: GetServerSideProps<
  IEditRankingProps,
  {
    accessToken: string;
  }
> = async (context) => {
  const accessToken = context.params?.accessToken || "";

  if (!accessToken) {
    return {
      notFound: true,
    };
  }

  const props = await getMovieRankingsForAccessToken(accessToken);
  return { props };
};
