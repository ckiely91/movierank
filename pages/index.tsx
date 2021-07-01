import Head from "next/head";
import { useRouter } from "next/router";
import { FC, useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import {
  getAllMoviesWithUserRankings,
  getAllMoviesWithUserRankingsResp,
} from "./api/allrankings";
import { GetServerSideProps } from "next";
import Image from "next/image";
import ArrowUpSvg from "../images/arrow-up-solid.svg";

import styles from "../styles/Home.module.scss";

interface IHomeProps extends getAllMoviesWithUserRankingsResp {}

const Home: FC<IHomeProps> = ({ userIds, rankedMovies, unrankedMovies }) => {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const storedAccessToken = localStorage.getItem("accessToken");
      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
      }
    }
  }, []);

  return (
    <div>
      <Head>
        <title>Movie Ranking</title>
      </Head>
      <Nav
        rightSection={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typeof localStorage !== "undefined") {
                localStorage.setItem("accessToken", accessToken);
              }
              setLoading(true);
              router.push(`/editranking/${accessToken}`);
            }}
          >
            <div className="field has-addons">
              <p className="control">
                <input
                  ref={inputRef}
                  className="input"
                  type="text"
                  placeholder="Enter access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </p>
              <p className="control">
                <button
                  type="submit"
                  disabled={!accessToken}
                  className={`button ${loading ? "is-loading" : ""}`}
                >
                  Edit ranking
                </button>
              </p>
            </div>
          </form>
        }
      />
      <section className="section">
        <div className="container">
          <h1 className="title">Current rankings</h1>
          <h2 className="subtitle">
            As each participant submits their movie rankings, this list will
            automatically update. It represents the average of all rankings. To
            get started,{" "}
            <a onClick={() => inputRef.current?.focus()}>
              enter your access code
            </a>{" "}
            above.
          </h2>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="table-container">
            <table className="table is-hoverable">
              <tbody>
                {rankedMovies.map((m, i) => {
                  const movieRankPct = i / (rankedMovies.length - 1);
                  return (
                    <tr key={m._id}>
                      <td>
                        <span
                          className={`tag is-light ${styles.numberTag}`}
                          title={m.trueskillMu.toString()}
                        >
                          {i + 1}
                        </span>
                        {m.title}
                        <span className="ml-2 has-text-grey">{m.year}</span>
                      </td>
                      {userIds.map((userId) => {
                        const ranking = m.userRankings.find(
                          (r) => r.userId === userId
                        );
                        if (!ranking) {
                          return <td key={userId} />;
                        }

                        return (
                          <td key={userId}>
                            <div
                              className={`tags has-addons ${styles.rankingTag}`}
                            >
                              {ranking.rankPct < movieRankPct ? (
                                <span className="tag is-success">
                                  <span className={`icon ${styles.tagIcon}`}>
                                    <Image src={ArrowUpSvg} />
                                  </span>
                                </span>
                              ) : ranking.rankPct > movieRankPct ? (
                                <span className="tag is-danger">
                                  <span
                                    className={`icon ${styles.tagIcon} ${styles.tagFlip}`}
                                  >
                                    <Image src={ArrowUpSvg} />
                                  </span>
                                </span>
                              ) : (
                                <span className="tag is-info">-</span>
                              )}
                              <span className="tag is-light">
                                {ranking.userName} ({ranking.rankNumber}/
                                {ranking.rankOutOf})
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps<IHomeProps> = async (_) => {
  const props = await getAllMoviesWithUserRankings();
  return {
    props: {
      ...props,
    },
  };
};
