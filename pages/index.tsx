import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div>
      <Head>
        <title>Movie Ranking</title>
      </Head>
      <div className="container">
        <section className="hero is-primary">
          <div className="hero-body">
            <p className="title">Movie Ranking</p>
            <p className="subtitle">To continue, enter your access token</p>
          </div>
        </section>
        <section className="section">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              router.push(`/${accessToken}`);
            }}
          >
            <div className="field">
              <div className="control">
                <input
                  type="text"
                  className="input"
                  placeholder="Access token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <div className="control">
                <button
                  className={`button is-primary ${loading ? "is-loading" : ""}`}
                  type="submit"
                >
                  Continue
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
