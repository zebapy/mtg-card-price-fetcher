import Head from "next/head";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { PriceResult } from "./api/prices";

enum FetcherStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

function ResultBox({ id, label, value }) {
  const [copied, setCopied] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    if (state.value) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [state]);

  return (
    <div className="max-w-md">
      <label htmlFor={id} className="text-sm font-semibold block mb-1">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        readOnly
        className="rounded block w-full h-32 max-w-md bg-gray-200 p-2 text-sm mb-2"
      />
      <button
        type="button"
        className="rounded-full bg-gray-200 text-gray-600 px-3 py-1 text-sm font-semibold hover:text-gray-800 hover:bg-gray-300 transition-colors"
        onClick={() => copyToClipboard(value)}
      >
        {copied ? "Copied!" : "Copy to clipboard"}
      </button>
    </div>
  );
}

export default function Home() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(FetcherStatus.IDLE);

  async function onSubmit(e) {
    e.preventDefault();

    setStatus(FetcherStatus.LOADING);

    const resp = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prices: value,
      }),
    });

    if (!resp.ok) {
      const data = await resp.json();
      setError(data.error);
      setStatus(FetcherStatus.ERROR);
      return;
    }

    const data = (await resp.json()) as PriceResult;

    setResult(data);

    setStatus(FetcherStatus.SUCCESS);
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>MTG card price getter</title>
        <meta
          name="description"
          content="Paste a csv of card info, get prices back"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container p-12 max-w">
        <main className="">
          <h1 className="font-bold text-4xl mb-2">
            Magic: the Gathering Price Fetcher 🦉
          </h1>

          <p className="text-xl text-gray-600 mb-4">
            Paste a csv of MTG card info, get prices back
          </p>

          <div className="space-y-6">
            <form onSubmit={onSubmit}>
              <label htmlFor="cards" className="font-semibold">
                Cards{" "}
                <abbr
                  title="Comma Separated Values"
                  className="border-gray-100"
                >
                  CSV
                </abbr>
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Your csv must have a `header` row with at least set_code (e.g.
                BFZ) and card_number (133)
              </p>
              <textarea
                name="cards"
                id="cards"
                placeholder={`name,set_code,card_number\nSwamp,BFZ,1`}
                onChange={(e) => setValue(e.target.value)}
                className="p-4 block w-full rounded mb-2 max-w-3xl resize-y h-32"
                required
              />
              <button
                type="submit"
                className="rounded-full bg-purple-500 text-white py-2 px-4 font-bold hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-wait"
                disabled={status === FetcherStatus.LOADING}
              >
                {status === FetcherStatus.LOADING
                  ? "Fetching prices..."
                  : "Fetch prices"}
              </button>
            </form>

            {status === FetcherStatus.ERROR && (
              <p className="bg-red-400 text-white mb-4 p-2 rounded max-w-md">
                <strong>Uh oh!</strong> {error}
              </p>
            )}

            {status === FetcherStatus.SUCCESS && (
              <div className="space-y-4 border-2 border-green-400 p-8 rounded-lg">
                <h2 className="text-green-500 font-bold text-lg">
                  We found prices for {result?.found_total} cards out of{" "}
                  {result?.total}
                </h2>

                {result?.found && (
                  <ResultBox
                    id="found"
                    label={`Found cards (${result.found_total}) 👍`}
                    value={result.found}
                  />
                )}
                {result?.unfound && (
                  <ResultBox
                    id="unfound"
                    label={`Unfound cards (${result.unfound_total}) 👎`}
                    value={result.unfound}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        <footer className="space-y-2 pt-16 text-sm text-gray-500 ">
          <p className="">
            Prices supplied by{" "}
            <a
              href="https://scryfall.com/"
              className="text-purple-500 underline"
            >
              Scryfall API
            </a>{" "}
            though this is not a partner site
          </p>

          <p>Not affiliated with MTG Wizards of the Coast.</p>

          <p>
            Built by{" "}
            <a href="https://zeb.codes" className="underline text-purple-500">
              zeb.codes
            </a>
            .{" "}
            <a
              href="https://github.com/zebapy/mtg-card-price-fetcher"
              className="underline text-purple-500"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
