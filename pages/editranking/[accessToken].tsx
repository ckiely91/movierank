import { Movie } from "../../db/movieCollection";
import { FC, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { getMovieRankingsForAccessToken } from "../api/ranking";
import Head from "next/head";
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from "react-dnd";
import BarsSvg from "../../images/bars-solid.svg";
import { useRouter } from "next/router";
import Nav from "../../components/Nav";

import styles from "../../styles/EditRanking.module.scss";

interface IDraggableMovieProps {
  movie: Movie<string>;
  index: number;
  isRanked: boolean;
  showRank?: boolean;
  moveMovie: (
    dragIndex: number,
    hoverIndex: number,
    switchList: boolean
  ) => void;
}

interface DragItem {
  index: number;
  id: string;
  isRanked: boolean;
}

const DraggableMovie: FC<IDraggableMovieProps> = ({
  movie,
  index,
  moveMovie,
  showRank = false,
  isRanked,
}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: "MOVIE",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }

      // Check if the item is being moved from one list to another.
      const switchList = item.isRanked !== isRanked;

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (!switchList && dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (
        !switchList &&
        dragIndex < hoverIndex &&
        hoverClientY < hoverMiddleY
      ) {
        return;
      }

      // Dragging upwards
      if (
        !switchList &&
        dragIndex > hoverIndex &&
        hoverClientY > hoverMiddleY
      ) {
        return;
      }

      // Time to actually perform the action
      moveMovie(dragIndex, hoverIndex, switchList);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
      if (item.isRanked !== isRanked) {
        item.isRanked = !item.isRanked;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "MOVIE",
    item: (): DragItem => {
      return { id: movie._id, index, isRanked };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <a className="panel-block" ref={ref} data-handler-id={handlerId}>
      <span className="panel-icon">
        <Image src={BarsSvg} />
      </span>
      {showRank && (
        <span className={`tag is-light ${styles.rankTag}`}>{index + 1}</span>
      )}
      {movie.title}
      <span className="ml-2 has-text-grey">{movie.year}</span>
    </a>
  );
};

interface IEditRankingProps {
  accessToken: string;
  rankedMovies: Movie<string>[];
  unrankedMovies: Movie<string>[];
  userName: string;
}

const EditRanking: FC<IEditRankingProps> = ({
  accessToken,
  userName,
  rankedMovies: originalRankedMovies,
  unrankedMovies: originalUnrankedMovies,
}) => {
  const [rankedMovies, setRankedMovies] = useState(originalRankedMovies);
  const [unrankedMovies, setUnrankedMovies] = useState(originalUnrankedMovies);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [backLoading, setBackLoading] = useState(false);
  const router = useRouter();

  const moveMovieFunc =
    (ranked: boolean) =>
    (dragIndex: number, hoverIndex: number, switchList: boolean) => {
      if (switchList) {
        // We're moving from one list to another.
        let movie: Movie<string>;
        const removeFromListFunc = (
          movies: Movie<string>[]
        ): Movie<string>[] => {
          const newMovies = [...movies];
          if (dragIndex > movies.length - 1) {
            return movies;
          }

          [movie] = newMovies.splice(dragIndex, 1);
          return newMovies;
        };

        const addToListFunc = (movies: Movie<string>[]): Movie<string>[] => {
          if (!movie) {
            return movies;
          }

          const newMovies = [...movies];
          newMovies.splice(hoverIndex, 0, movie);
          return newMovies;
        };

        if (ranked) {
          setUnrankedMovies(removeFromListFunc);
          setRankedMovies(addToListFunc);
        } else {
          setRankedMovies(removeFromListFunc);
          setUnrankedMovies(addToListFunc);
        }

        return;
      }

      const updateStateFunc = (movies: Movie<string>[]): Movie<string>[] => {
        const newMovies = [...movies];
        if (dragIndex > movies.length - 1) {
          return movies;
        }

        const [movie] = newMovies.splice(dragIndex, 1);
        newMovies.splice(hoverIndex, 0, movie);
        return newMovies;
      };

      if (ranked) {
        setRankedMovies(updateStateFunc);
      } else {
        setUnrankedMovies(updateStateFunc);
      }
    };

  const handleDropIntoEmptyList = (item: DragItem, _: DropTargetMonitor) => {
    // A movie has been dropped from one list into another.
    // Look for it in the ranked or unranked list, and move it to the other list.
    if (item.isRanked) {
      const idx = rankedMovies.findIndex((m) => m._id === item.id);
      if (idx > -1) {
        // Move our movie to the unranked list
        const newRankedMovies = [...rankedMovies];
        const [movie] = newRankedMovies.splice(idx, 1);
        setRankedMovies(newRankedMovies);
        setUnrankedMovies([...unrankedMovies, movie]);

        return;
      }
    } else {
      const idx = unrankedMovies.findIndex((m) => m._id === item.id);
      if (idx > -1) {
        // Move our movie to the ranked list
        const newUnrankedMovies = [...unrankedMovies];
        const [movie] = newUnrankedMovies.splice(idx, 1);
        setUnrankedMovies(newUnrankedMovies);
        setRankedMovies([...rankedMovies, movie]);
        return;
      }
    }
  };

  const [, rankedListDrop] = useDrop({
    accept: "MOVIE",
    drop: handleDropIntoEmptyList,
  });

  const [, unrankedListDrop] = useDrop({
    accept: "MOVIE",
    drop: handleDropIntoEmptyList,
  });

  const submitRankings = async () => {
    setSubmitLoading(true);

    try {
      await fetch(`/api/ranking?accessToken=${accessToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rankedMovies.map((m) => m._id)),
      });

      // Then take the user back to the home page to see results
      router.push("/");
    } catch (e) {
      setSubmitLoading(false);
      console.error(e);
      alert("An error occurred");
    }
  };

  return (
    <div>
      <Head>
        <title>Movie Ranking</title>
      </Head>
      <Nav
        rightSection={
          <div className="navbar-item">
            <div className="buttons">
              <a
                className={`button is-light ${backLoading ? "is-loading" : ""}`}
                onClick={() => {
                  setBackLoading(true);
                  router.push("/");
                }}
              >
                Back to Rankings
              </a>
              <a
                className={`button is-primary ${
                  submitLoading ? "is-loading" : ""
                }`}
                onClick={submitRankings}
              >
                Save changes
              </a>
            </div>
          </div>
        }
      />
      <section className="section">
        <div className="container">
          <h1 className="title">Hi, {userName}! Rank your movies</h1>
          <h2 className="subtitle">
            Drag any movies you&apos;ve seen into the left column to rank them.
            Click the <strong>Save changes</strong> button when you&apos;re
            done.
          </h2>
          <div className={styles.grid}>
            <nav className="panel is-primary">
              <p className="panel-heading">Your ranked movies</p>
              {rankedMovies.length === 0 ? (
                <div className="p-4" ref={rankedListDrop}>
                  Drag a movie here to start ranking.
                </div>
              ) : (
                rankedMovies.map((m, i) => (
                  <DraggableMovie
                    movie={m}
                    key={m._id}
                    index={i}
                    isRanked
                    showRank
                    moveMovie={moveMovieFunc(true)}
                  />
                ))
              )}
            </nav>
            <nav className="panel">
              <p className="panel-heading">Not yet ranked</p>
              {unrankedMovies.length === 0 ? (
                <div className="p-4" ref={unrankedListDrop}>
                  Drag a movie here to start ranking.
                </div>
              ) : (
                unrankedMovies.map((m, i) => (
                  <DraggableMovie
                    movie={m}
                    key={m._id}
                    index={i}
                    isRanked={false}
                    moveMovie={moveMovieFunc(false)}
                  />
                ))
              )}
            </nav>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EditRanking;

export const getServerSideProps: GetServerSideProps<
  IEditRankingProps,
  {
    accessToken: string;
  }
> = async (context) => {
  const accessToken = context.params?.accessToken || "";

  const props = await getMovieRankingsForAccessToken(accessToken);
  return {
    props: {
      ...props,
      accessToken,
    },
  };
};
