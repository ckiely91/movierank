import Head from "next/head";
import { useRouter } from "next/router";
import { FC, useRef, useState } from "react";
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
        <div className="container is-max-desktop">
          <nav className="panel is-primary">
            <p className="panel-heading">Results</p>
            {rankedMovies.map((m, i) => (
              <div className="panel-block" key={m._id}>
                <span
                  className={`tag is-light ${styles.numberTag}`}
                  title={m.trueskillMu.toString()}
                >
                  {i + 1}
                </span>
                {m.title}
                <span className="ml-2 has-text-grey">{m.year}</span>
                <div className="field is-grouped is-grouped-multiline ml-auto">
                  {m.userRankings.map((r) => (
                    <div className="control" key={r.userName}>
                      <div className="tags has-addons">
                        {r.rankPct < m.averageRanking ? (
                          <span className="tag is-success">
                            <span className={`icon ${styles.tagIcon}`}>
                              <Image src={ArrowUpSvg} />
                            </span>
                          </span>
                        ) : r.rankPct > m.averageRanking ? (
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
                        <span
                          className="tag is-light"
                          title={r.rankPct.toString()}
                        >
                          {r.userName} ({r.rankNumber}/{r.rankOutOf})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
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
